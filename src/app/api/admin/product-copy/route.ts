import { getCurrentAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { rewriteRequestSchema } from "@/lib/product-copy";
import { CopyServiceError, generateProductCopy, readLimitedText } from "@/lib/product-copy-ai";

export const runtime = "nodejs";
export const maxDuration = 120;
const requests = new Map<string, { started: number; pending: boolean }>();
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  if (!await getCurrentAdmin()) return json({ error: "登录已过期，请重新登录。" }, 401);
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId || productId.length > 100) return json({ error: "缺少商品编号。" }, 400);
  const revisions = await prisma.productCopyRevision.findMany({ where: { productId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30,
    select: { id: true, snapshot: true, changedFields: true, reason: true, createdAt: true } });
  return json({ revisions });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return json({ error: "登录已过期，请重新登录。" }, 401);
  // Next's internal request URL may use localhost behind a proxy. Compare the browser's
  // Origin against Host, which the browser cannot override, rather than that internal URL.
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get("origin") || "");
    sameOrigin = ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host");
  } catch { /* Missing or malformed Origin is rejected. */ }
  if (!sameOrigin || request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "请求来源无效。" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "请发送 JSON 请求。" }, 415);
  const now = Date.now();
  for (const [id, item] of requests) if (now - item.started > 120_000) requests.delete(id);
  const prior = requests.get(admin.id);
  if (prior && (prior.pending || now - prior.started < 10_000)) return json({ error: "正在处理或操作过于频繁，请稍后重试。" }, 429);
  requests.set(admin.id, { started: now, pending: true });
  try {
    const input = rewriteRequestSchema.safeParse(JSON.parse(await readLimitedText(request.body, 180_000)));
    if (!input.success) return json({ error: "请先填写商品名称和摘要，并检查文案长度。" }, 400);
    return json(await generateProductCopy(input.data, request.signal));
  } catch (error) {
    if (error instanceof CopyServiceError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "文案数据格式无效，请重新生成。" }, 400);
    return json({ error: "生成失败或超时，请稍后重试。原文案未修改。" }, 502);
  } finally { const item = requests.get(admin.id); if (item?.started === now) item.pending = false; }
}
