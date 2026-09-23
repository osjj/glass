"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { COPY_FIELDS, COPY_LABELS, MAX_COPY_REFERENCE_IMAGES, changedCopyFields, copySchema, mergeSelectedCopy, sameSectionKeys,
  type CopyField, type CopyReferenceImage, type ProductCopy, type RewriteRequest, type RewriteResult } from "@/lib/product-copy";

type Revision = { id: string; snapshot: ProductCopy; reason: string; createdAt: string };
type CopyMode = "rewrite" | "optimize";
type ImageOption = CopyReferenceImage & { alt: string };
const display = (value: ProductCopy[CopyField]) => typeof value === "string" ? value || "（空）" :
  value.map((v) => typeof v === "string" ? `• ${v}` : `${v.title}\n${v.body}`).join("\n\n") || "（空）";

export function ProductCopyEditor({ productId, copy, getFacts, imageOptions, onApply, disabled, onBusyChange, protectedFields }: {
  productId?: string; copy: ProductCopy; getFacts: () => RewriteRequest["facts"];
  imageOptions: ImageOption[];
  onApply: (value: ProductCopy, fields: CopyField[], reason: "AI assisted" | "Restore") => void;
  disabled: boolean; onBusyChange: (busy: boolean) => void; protectedFields: string[];
}) {
  const [mode, setMode] = useState<CopyMode>("rewrite");
  const [fields, setFields] = useState<CopyField[]>([...COPY_FIELDS]);
  const [buyerFocus, setBuyerFocus] = useState("");
  const [verifiedNotes, setVerifiedNotes] = useState("");
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>(() => {
    const gallery = imageOptions.filter((image) => image.role === "gallery");
    const detail = imageOptions.filter((image) => image.role === "detail");
    return [...gallery.slice(0, 2), ...detail.slice(0, 1)].map((image) => image.url);
  });
  const [selected, setSelected] = useState<CopyField[]>([]);
  const [preview, setPreview] = useState<{ before: ProductCopy; result: RewriteResult; context: string; reason: "AI assisted" | "Restore" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<Revision[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const selectedImages = () => mode === "optimize" ? imageOptions.filter((image) => selectedImageUrls.includes(image.url))
    .slice(0, MAX_COPY_REFERENCE_IMAGES).map(({ url, role }) => ({ url, role })) : [];
  const context = () => JSON.stringify({ copy, facts: getFacts(), mode, buyerFocus, verifiedNotes, images: selectedImages() });
  const toggle = (list: CopyField[], field: CopyField) => list.includes(field) ? list.filter((f) => f !== field) : [...list, field];

  async function generate() {
    setError(""); setNotice("");
    if (!fields.length) { setError("请至少选择一个字段。"); return; }
    if (!copySchema.safeParse(copy).success) { setError("请先填写商品名称、摘要，并检查详情区块标题和文案长度。"); return; }
    const input: RewriteRequest = { mode, copy: structuredClone(copy), fields, facts: getFacts(), buyerFocus, verifiedNotes, images: selectedImages() };
    const originalContext = JSON.stringify({ copy: input.copy, facts: input.facts, mode, buyerFocus, verifiedNotes, images: input.images });
    controller.current = new AbortController();
    setBusy(true); onBusyChange(true);
    try {
      const response = await fetch("/api/admin/product-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: controller.current.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "生成失败，请重试。");
      setPreview({ before: input.copy, result: payload, context: originalContext, reason: "AI assisted" });
      setSelected(changedCopyFields(input.copy, payload.copy).filter((f) => fields.includes(f)));
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch (e) {
      setError(e instanceof Error && e.name === "AbortError" ? "已取消，原文案未修改。" : e instanceof Error ? e.message : "生成失败。");
    } finally { setBusy(false); onBusyChange(false); controller.current = null; }
  }
  async function loadHistory() {
    setError(""); setLoadingHistory(true);
    try {
      const response = await fetch(`/api/admin/product-copy?productId=${encodeURIComponent(productId!)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "历史版本读取失败。");
      setHistory(payload.revisions);
    } catch (e) { setError(e instanceof Error ? e.message : "历史版本读取失败。"); }
    finally { setLoadingHistory(false); }
  }
  function restore(revision: Revision) {
    const snapshot = copySchema.safeParse(revision.snapshot);
    if (!snapshot.success) { setError("该历史版本格式不兼容，未修改当前文案。"); return; }
    const compatible = sameSectionKeys(copy, snapshot.data);
    const proposal = { ...snapshot.data, contentSections: compatible ? snapshot.data.contentSections : copy.contentSections };
    setPreview({ before: structuredClone(copy), result: { copy: proposal, warnings: compatible ? [] : ["详情区块结构已经变化，本次仅恢复其他文案，保留现有区块和图片。"] }, context: context(), reason: "Restore" });
    setSelected(changedCopyFields(copy, proposal)); setError(""); setNotice("");
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  function apply(adopt: CopyField[]) {
    if (!preview || !adopt.length) return;
    if (context() !== preview.context) { setError("预览后表单内容已经变化。请重新生成或重新预览历史版本，以免覆盖新编辑。"); return; }
    onApply(mergeSelectedCopy(copy, preview.result.copy, adopt), adopt, preview.reason);
    setPreview(null); setError(""); setNotice("已填入表单，请检查后点击底部保存按钮。网址、参数和图片保持不变。");
  }
  const changed = preview ? changedCopyFields(preview.before, preview.result.copy) : [];
  return <section aria-labelledby="copy-editor-title" className="rounded-2xl border border-[#bacdde] bg-[#f5f9fc] p-5 sm:p-7">
    <h2 id="copy-editor-title" className="text-lg font-black">AI 商品文案</h2>
    <p className="mt-2 text-sm text-[var(--ink-muted)]">生成英文商品文案，逐项对照后采用。生成不会自动保存。</p>
    <fieldset className="mt-4 grid gap-3 sm:grid-cols-2" disabled={busy || disabled}>
      <legend className="mb-2 text-sm font-bold">处理方式</legend>
      {([ ["rewrite", "一键改写", "润色现有字段，保留详情区块数量。"], ["optimize", "产品页优化", "补充具体卖点、购买信息和文字区块。"] ] as const).map(([value, label, hint]) =>
        <label key={value} className={`cursor-pointer rounded-xl border p-4 text-sm ${mode === value ? "border-[#3976a5] bg-white" : "border-[#d5dfe7] bg-[#f8fbfd]"}`}>
          <span className="flex items-center gap-2 font-bold"><input type="radio" name="copyMode" checked={mode === value} onChange={() => { setMode(value); setPreview(null); setNotice(""); setError(""); }} />{label}</span>
          <span className="mt-1 block pl-6 text-xs text-[var(--ink-muted)]">{hint}</span>
        </label>)}
    </fieldset>
    {mode === "optimize" ? <div className="mt-4 space-y-3 rounded-xl border border-[#d5dfe7] bg-white p-4">
      <label className="block text-sm font-bold">目标买家或应用场景（可选）<input className="mt-2 w-full rounded-lg border border-[#ccd3ce] p-3 text-sm font-normal" value={buyerFocus} onChange={(event) => setBuyerFocus(event.target.value)} maxLength={500} placeholder="例如：餐饮采购、酒吧补货、礼品定制询盘" /></label>
      <label className="block text-sm font-bold">已核实的补充事实（可选）<textarea className="mt-2 min-h-24 w-full rounded-lg border border-[#ccd3ce] p-3 text-sm font-normal" value={verifiedNotes} onChange={(event) => setVerifiedNotes(event.target.value)} maxLength={2000} placeholder="仅填写已确认的材质、容量、包装或可提供的定制方式等" /></label>
      <div>
        <p className="text-sm font-bold">参考商品图片（最多 {MAX_COPY_REFERENCE_IMAGES} 张，可选）</p>
        {!imageOptions.length ? <p className="mt-2 text-xs text-[var(--ink-muted)]">当前表单没有商品图片，可以先上传，再选择作为 AI 参考。</p> :
          <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5">
            {imageOptions.map((image) => {
              const checked = selectedImageUrls.includes(image.url);
              return <label key={image.url} className={`cursor-pointer rounded-lg border p-2 text-xs ${checked ? "border-[#3976a5] bg-[#f5f9fc]" : "border-[#d5dfe7]"}`}>
                <Image src={image.url} alt={image.alt || "Product reference"} width={160} height={120} unoptimized className="aspect-[4/3] w-full rounded object-contain" />
                <span className="mt-2 flex items-center gap-1"><input type="checkbox" checked={checked} disabled={busy || disabled || (!checked && selectedImages().length >= MAX_COPY_REFERENCE_IMAGES)} onChange={() => setSelectedImageUrls((current) => checked ? current.filter((url) => url !== image.url) : [...current, image.url])} />{image.role === "gallery" ? "主图" : "详情图"}</span>
              </label>;
            })}
          </div>}
        <p className="mt-2 text-xs text-[var(--ink-muted)]">已选 {selectedImages().length} 张。仅本站或已配置媒体域名的公开图片可发送给 AI，可能增加生成费用；图片仅供参考可见外观，参数和认证仍以核实资料为准。</p>
      </div>
    </div> : null}
    <fieldset className="mt-4 flex flex-wrap gap-4" disabled={busy || disabled}>
      <legend className="mb-2 text-sm font-bold">选择改写内容</legend>
      {COPY_FIELDS.map((field) => <label key={field} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.includes(field)} onChange={() => setFields(toggle(fields, field))} />{COPY_LABELS[field]}</label>)}
    </fieldset>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="button-primary" disabled={busy || disabled || !fields.length} onClick={generate}>{busy ? "正在生成…" : mode === "optimize" ? "生成产品页优化建议" : "生成改写建议"}</button>
      {busy ? <button type="button" className="button-secondary" onClick={() => controller.current?.abort()}>取消生成</button> : null}
      {productId ? <button type="button" className="button-secondary" disabled={busy || disabled || loadingHistory} onClick={loadHistory}>{loadingHistory ? "正在读取…" : "查看 / 刷新文案历史"}</button> : null}
    </div>
    {protectedFields.length ? <p className="mt-3 text-xs text-[var(--ink-muted)]">保存后受同步保护：{protectedFields.map((f) => COPY_LABELS[f as CopyField] || f).join("、")}</p> : null}
    {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    {notice ? <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p> : null}
    {history ? <details open className="mt-5 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-bold">文案历史（最近 30 次保存前的版本）</summary>
      {!history.length ? <p className="mt-3 text-sm">暂无历史。下次修改文案并保存时，会自动保留修改前的版本。</p> : <ul className="mt-3 space-y-3">{history.map((revision) => <li key={revision.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
        <span>{new Date(revision.createdAt).toLocaleString()} · {revision.reason === "Restore" ? "恢复前" : revision.reason === "AI assisted" ? "AI 改写前" : "编辑前"}</span>
        <button type="button" className="button-secondary" disabled={busy || disabled} onClick={() => restore(revision)}>预览恢复</button>
      </li>)}</ul>}
    </details> : null}
    {preview ? <div ref={previewRef} className="mt-6 scroll-mt-8 space-y-4">
      <h3 className="font-black">{preview.reason === "Restore" ? "恢复版本对照" : "当前与建议文案对照"}</h3>
      <p className="text-sm">请核对型号、参数和承诺；AI 校验不能替代人工确认。</p>
      {preview.result.warnings.length ? <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">需要检查</p><ul className="mt-2 list-disc space-y-1 pl-5">{preview.result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div> : null}
      {!changed.length ? <p className="text-sm">没有可采用的变化，可调整选择后重新生成。</p> : changed.map((field) => <div key={field} className="rounded-xl border bg-white p-4">
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={selected.includes(field)} onChange={() => setSelected(toggle(selected, field))} />{COPY_LABELS[field]}</label>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div><p className="text-xs font-bold text-[var(--ink-muted)]">当前文案</p><p className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-6">{display(preview.before[field])}</p></div>
          <div><p className="text-xs font-bold text-[#075989]">{preview.reason === "Restore" ? "历史文案" : "建议文案"}</p><p className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-6">{display(preview.result.copy[field])}</p></div>
        </div>
      </div>)}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="button-primary" disabled={busy || disabled || !selected.length} onClick={() => apply(selected)}>采用所选 ({selected.length})</button>
        <button type="button" className="button-secondary" disabled={busy || disabled || !changed.length} onClick={() => apply(changed)}>全部采用</button>
        <button type="button" className="button-secondary" disabled={busy || disabled} onClick={generate}>重新生成</button>
        <button type="button" className="button-secondary" onClick={() => setPreview(null)}>关闭对照</button>
      </div>
    </div> : null}
  </section>;
}
