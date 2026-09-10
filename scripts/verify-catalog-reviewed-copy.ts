import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";

async function main() {
  const directory = process.argv[2];
  assert(directory, "Pass the applied review directory");
  const { plans } = JSON.parse(await readFile(`${directory}/review-and-backup.json`, "utf8")) as {
    plans: { slug: string; data: { summary?: string }; restoreFeatures: { value: string }[] }[];
  };
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  let next = 0;
  const results: { url: string; status?: number; missing?: number; metaMatches?: boolean; brandResidue?: boolean; error?: string }[] = [];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < plans.length) {
      const plan = plans[next++];
      const url = `https://www.glarivoglass.com/products/${plan.slug}`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const $ = load(await response.text());
        $("script, style, noscript").remove();
        const visible = normalize($("body").text());
        results.push({ url, status: response.status,
          missing: plan.restoreFeatures.filter(x => !visible.includes(normalize(x.value))).length,
          metaMatches: !plan.data.summary || $("meta[name='description']").attr("content") === plan.data.summary,
          brandResidue: /garbo/i.test(visible + $("title").text() + $("img").map((_, el) => $(el).attr("alt") || "").get().join(" ")),
        });
      } catch (error) {
        results.push({ url, error: String(error) });
      }
    }
  }));
  await writeFile(`${directory}/live-verification.json`, JSON.stringify(results, null, 2));
  const failures = results.filter(x => x.error || x.status !== 200 || x.missing || !x.metaMatches || x.brandResidue);
  console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
  assert.equal(failures.length, 0, "Live content did not match review");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
