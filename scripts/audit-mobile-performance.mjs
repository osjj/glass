import { spawn } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const allPages = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "guide-cosmetic", path: "/guides/cosmetic-glass-packaging" },
  { name: "category-shot", path: "/products/category/shot-glass" },
  { name: "category-cosmetic", path: "/products/category/cosmetic-glass-packaging" },
  { name: "blog-dishwasher", path: "/blog/restaurant-glassware-dishwasher-rack-fit-storage-checklist" },
];
let pages = allPages;

const help = `Run sequential mobile Lighthouse production audits (does not build or start the app).

node scripts/audit-mobile-performance.mjs --base-url http://127.0.0.1:3008 --label before --runs 3 --output-dir output/mobile-performance/2026-11-15

Options:
  --base-url        Required HTTP(S) origin; no path, query or credentials.
  --label           Required new output label, e.g. before or after.
  --runs            Runs per page; default 3.
  --pages           Optional comma-separated page names; default all six. Use home for a homepage-only recheck.
  --output-dir      Output root; default output/mobile-performance/YYYY-MM-DD.
  --lighthouse-cli  Optional absolute path to lighthouse/cli/index.js.
  --compare         Optional path to an earlier summary.json.
  --resume          Reuse valid raw reports under the same label; retry missing/invalid runs once.
  --help            Show this message without launching Chrome.

CHROME_PATH may select the Chrome executable; otherwise chrome-launcher discovers it.
Lighthouse must already be available; no package is installed automatically.
`;

function optionsFrom(argv) {
  const allowed = new Set(["base-url", "label", "runs", "pages", "output-dir", "lighthouse-cli", "compare", "resume"]);
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    const key = argument.replace(/^--/, "");
    if (!argument.startsWith("--") || !allowed.has(key) || options[key] !== undefined) {
      throw new Error(`Unknown or repeated option: ${argument}. Use --help.`);
    }
    if (key === "resume") { options.resume = true; continue; }
    const value = argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}.`);
    options[key] = value;
  }
  if (!options["base-url"] || !options.label) throw new Error("--base-url and --label are required. Use --help.");
  const base = new URL(options["base-url"]);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("--base-url must be an HTTP(S) origin without a path, query, hash or credentials.");
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(options.label)) throw new Error("--label may contain only letters, numbers, underscores and hyphens.");
  const runs = Number(options.runs ?? 3);
  if (!Number.isSafeInteger(runs) || runs < 1) throw new Error("--runs must be a positive integer.");
  if (options.pages) {
    const names = options.pages.split(",");
    if (new Set(names).size !== names.length || names.some((name) => !allPages.some((page) => page.name === name))) {
      throw new Error(`--pages must contain unique known names: ${allPages.map((page) => page.name).join(", ")}.`);
    }
  }
  if (options["lighthouse-cli"] && !path.isAbsolute(options["lighthouse-cli"])) throw new Error("--lighthouse-cli must be an absolute file path.");
  return { ...options, baseUrl: base.origin, runs, outputDir: path.resolve(options["output-dir"] ?? `output/mobile-performance/${new Date().toISOString().slice(0, 10)}`) };
}

async function findLighthouse(options) {
  let cli = options["lighthouse-cli"];
  if (!cli) {
    try {
      cli = createRequire(import.meta.url).resolve("lighthouse/cli/index.js");
    } catch {
      throw new Error("Lighthouse is not resolvable. Populate an npm cache with: npm exec --yes --package=lighthouse@13.6.0 -- lighthouse --version\nThen pass the absolute cached lighthouse/cli/index.js path with --lighthouse-cli. See docs/mobile-performance.md. No installation was attempted.");
    }
  }
  await access(cli);
  return cli;
}

function runLighthouse(cli, url, outputPath, configPath) {
  const args = [cli, url, `--config-path=${configPath}`, "--only-categories=performance", "--form-factor=mobile", "--throttling-method=simulate", "--output=json", `--output-path=${outputPath}`, "--chrome-flags=--headless=new --no-sandbox --disable-extensions", "--quiet"];
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Lighthouse exited with ${signal ? `signal ${signal}` : `code ${code}`}.`));
    });
  });
}

function canonicalUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.href;
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  for (const item of Object.values(value)) walk(item, visit);
}

function lcpEvidence(audits, requests, documentUrl) {
  const auditIds = ["lcp-breakdown-insight", "lcp-discovery-insight", "largest-contentful-paint-element"];
  let element = null;
  let elementAudit = null;
  const breakdownMs = {};
  for (const auditId of auditIds) {
    walk(audits[auditId]?.details, (item) => {
      if (!element && item.type === "node") {
        element = item;
        elementAudit = auditId;
      }
      if (item.subpart && Number.isFinite(item.duration)) breakdownMs[item.subpart] = item.duration;
    });
  }
  const resources = new Map();
  function addResource(url, evidence) {
    try {
      const absoluteUrl = new URL(url.replaceAll("&amp;", "&"), documentUrl).href;
      const request = requests.find((item) => item.url === absoluteUrl);
      resources.set(absoluteUrl, {
        url: absoluteUrl,
        evidence,
        observedInNetwork: Boolean(request),
        transferBytes: request?.transferSize ?? null,
        resourceBytes: request?.resourceSize ?? null,
        statusCode: request?.statusCode ?? null,
      });
    } catch { /* Keep the original audit in the raw report if the URL is not usable. */ }
  }
  if (element) {
    // New insight tables can link the painted node to the actual requested URL.
    for (const [auditId, audit] of Object.entries(audits)) {
      walk(audit.details, (item) => {
        const sameNode = item.node && ((element.lhId && item.node.lhId === element.lhId) || (element.selector && item.node.selector === element.selector));
        if (sameNode && typeof item.url === "string") addResource(item.url, `${auditId}: matching LCP node`);
      });
    }
    // A snippet's src may differ from the selected srcset candidate: label it as a candidate.
    const src = element.snippet?.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src && !resources.size) addResource(src, "LCP element src attribute; selected srcset resource may differ");
  }
  return { elementAudit, element, resourceCandidates: [...resources.values()], breakdownMs };
}

function extractReport(lhr, expectedUrl, reportPath) {
  if (lhr.runtimeError) throw new Error(`Lighthouse runtimeError: ${lhr.runtimeError.code ?? "unknown"}: ${lhr.runtimeError.message ?? ""}`);
  for (const key of ["requestedUrl", "finalDisplayedUrl", "mainDocumentUrl", "finalUrl"]) {
    if (lhr[key] && canonicalUrl(lhr[key]) !== canonicalUrl(expectedUrl)) throw new Error(`Unexpected ${key}: ${lhr[key]} (expected ${expectedUrl}).`);
  }
  if (!lhr.requestedUrl || !(lhr.finalDisplayedUrl || lhr.finalUrl)) throw new Error("Report lacks requested/final URL evidence.");
  const score = lhr.categories?.performance?.score;
  if (!Number.isFinite(score) || score < 0 || score > 1) throw new Error("Report lacks a valid performance category score.");
  const settings = lhr.configSettings;
  if (!lhr.lighthouseVersion || settings?.formFactor !== "mobile" || settings?.throttlingMethod !== "simulate" || settings.disableStorageReset === true) throw new Error("Report is missing the expected Lighthouse version/mobile/simulate/storage-reset settings.");
  const audits = lhr.audits ?? {};
  function metric(id) {
    const value = audits[id]?.numericValue;
    if (!Number.isFinite(value) || value < 0 || audits[id]?.errorMessage) throw new Error(`Missing/invalid metric: ${id}.`);
    return value;
  }
  const requests = audits["network-requests"]?.details?.items;
  if (!Array.isArray(requests) || !requests.length) throw new Error("Report lacks network request evidence.");
  const sum = (key) => requests.reduce((total, item) => total + (Number.isFinite(item[key]) ? item[key] : 0), 0);
  return {
    status: "valid",
    reportPath,
    fetchedAt: lhr.fetchTime,
    requestedUrl: lhr.requestedUrl,
    finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl,
    lighthouseVersion: lhr.lighthouseVersion,
    settings,
    environment: lhr.environment ?? null,
    warnings: lhr.runWarnings ?? [],
    metrics: {
      score: score * 100,
      lcpMs: metric("largest-contentful-paint"),
      fcpMs: metric("first-contentful-paint"),
      cls: metric("cumulative-layout-shift"),
      tbtMs: metric("total-blocking-time"),
      networkTransferBytes: sum("transferSize"),
      networkResourceBytes: sum("resourceSize"),
      requestCount: requests.length,
    },
    lcp: lcpEvidence(audits, requests, lhr.finalDisplayedUrl ?? lhr.finalUrl),
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function comparisonSettings(run) {
  const settings = run.settings;
  return {
    lighthouseVersion: run.lighthouseVersion,
    hostUserAgent: run.environment?.hostUserAgent ?? null,
    formFactor: settings.formFactor,
    throttlingMethod: settings.throttlingMethod,
    throttling: settings.throttling,
    screenEmulation: settings.screenEmulation,
    emulatedUserAgent: settings.emulatedUserAgent,
    disableStorageReset: settings.disableStorageReset ?? false,
  };
}

function validateResumeManifest(previous, options) {
  if (previous.schemaVersion !== 1 || previous.label !== options.label || previous.baseUrl !== options.baseUrl || previous.runsPerPage !== options.runs) {
    throw new Error("--resume requires the same summary schema, label, base URL and run count.");
  }
  const expectedPaths = pages.map((page) => page.path);
  if (previous.pagePaths && JSON.stringify(previous.pagePaths) !== JSON.stringify(expectedPaths)) {
    throw new Error("--resume page paths do not match this script.");
  }
  // Older/interrupted summaries contain only completed pages: require the same prefix.
  if (!Array.isArray(previous.pages) || previous.pages.length > pages.length || previous.pages.some((page, index) => page.name !== pages[index].name || page.path !== pages[index].path || canonicalUrl(page.url) !== canonicalUrl(new URL(page.path, options.baseUrl).href))) {
    throw new Error("--resume summary page names, paths, order or URLs do not match this script.");
  }
}

async function reusableReport(pageDir, run, url, previousRun, expectedSettings) {
  const matcher = new RegExp(`^run-${run}(?:-retry-[a-zA-Z0-9_-]+)?\\.json$`);
  const fileNames = (await readdir(pageDir)).filter((name) => matcher.test(name)).sort().reverse();
  const candidates = fileNames.map((name) => path.join(pageDir, name));
  // Prefer the previously selected successful attempt when the summary has one.
  if (previousRun?.status === "valid" && previousRun.reportPath) {
    const savedPath = path.resolve(previousRun.reportPath);
    if (path.dirname(savedPath) !== pageDir || !matcher.test(path.basename(savedPath))) {
      throw new Error("--resume report path is outside the expected page directory.");
    }
    candidates.unshift(savedPath);
  }
  const previousAttempts = [...(previousRun?.previousAttempts ?? [])];
  for (const reportPath of new Set(candidates)) {
    try {
      const report = extractReport(JSON.parse(await readFile(reportPath, "utf8")), url, reportPath);
      if (expectedSettings && JSON.stringify(comparisonSettings(report)) !== expectedSettings) {
        throw new Error("Saved report settings differ from the original batch.");
      }
      return { report, previousAttempts };
    } catch (error) {
      if (!previousAttempts.some((attempt) => attempt.reportPath === reportPath)) {
        previousAttempts.push({ reportPath, status: "invalid", error: error.message });
      }
    }
  }
  return { report: null, previousAttempts };
}

async function retryReportPath(pageDir, run) {
  let timestamp = Date.now();
  for (;;) {
    const reportPath = path.join(pageDir, `run-${run}-retry-${timestamp}.json`);
    try {
      await access(reportPath);
      timestamp += 1;
    } catch (error) {
      if (error.code === "ENOENT") return reportPath;
      throw error;
    }
  }
}

async function main() {
  if (process.argv.includes("--help")) { console.log(help); return; }
  const options = optionsFrom(process.argv.slice(2));
  pages = options.pages ? allPages.filter((page) => options.pages.split(",").includes(page.name)) : allPages;
  const cli = await findLighthouse(options);
  const earlier = options.compare ? JSON.parse(await readFile(path.resolve(options.compare), "utf8")) : null;
  const labelDir = path.join(options.outputDir, options.label);
  const summaryPath = path.join(labelDir, "summary.json");
  let previous = null;
  if (options.resume) {
    previous = JSON.parse(await readFile(summaryPath, "utf8"));
    validateResumeManifest(previous, options);
  } else {
    await mkdir(options.outputDir, { recursive: true });
    // Never replace an earlier measurement without an explicit resume.
    await mkdir(labelDir);
  }
  const configPath = path.join(labelDir, "lighthouse.config.mjs");
  const navigationTimeoutMs = 90_000;
  await writeFile(configPath, `export default { extends: "lighthouse:default", settings: { maxWaitForFcp: ${navigationTimeoutMs}, maxWaitForLoad: ${navigationTimeoutMs} } };\n`);
  const summary = {
    schemaVersion: 1,
    label: options.label,
    baseUrl: options.baseUrl,
    startedAt: previous?.startedAt ?? new Date().toISOString(),
    nodeVersion: process.version,
    platform: `${process.platform}/${process.arch}`,
    lighthouseCli: cli,
    lighthouseConfigPath: configPath,
    navigationTimeoutMs,
    chromePath: process.env.CHROME_PATH ?? "auto-discovery",
    runsPerPage: options.runs,
    pagePaths: pages.map((page) => page.path),
    conditions: "Sequential mobile simulated Slow 4G; fresh Lighthouse browser profile/storage reset per run. Server/image/CDN caches are not cleared.",
    complete: false,
    resumeHistory: previous?.resumeHistory ?? [],
    pages: [],
  };
  if (options.resume) summary.resumeHistory.push({ resumedAt: new Date().toISOString(), reusedRuns: 0, attemptedRuns: 0 });
  const previousFirst = previous?.pages.flatMap((page) => page.runs ?? []).find((run) => run.status === "valid");
  let firstSettings = previousFirst ? JSON.stringify(comparisonSettings(previousFirst)) : null;
  let invalidRuns = 0;
  for (const page of pages) {
    const pageDir = path.join(labelDir, page.name);
    await mkdir(pageDir, { recursive: Boolean(options.resume) });
    const result = { ...page, url: new URL(page.path, options.baseUrl).href, runs: [] };
    for (let run = 1; run <= options.runs; run += 1) {
      let previousAttempts = [];
      if (options.resume) {
        const previousRun = previous.pages.find((candidate) => candidate.path === page.path)?.runs?.find((candidate) => candidate.run === run);
        const saved = await reusableReport(pageDir, run, result.url, previousRun, firstSettings);
        previousAttempts = saved.previousAttempts;
        if (saved.report) {
          firstSettings ??= JSON.stringify(comparisonSettings(saved.report));
          result.runs.push({ run, ...saved.report, reused: true, previousAttempts });
          summary.resumeHistory.at(-1).reusedRuns += 1;
          console.log(`[${options.label}] ${page.name} ${run}/${options.runs}: REUSED ${saved.report.reportPath}`);
          continue;
        }
      }
      // A resumed invocation attempts each invalid/missing slot only once and preserves old JSON.
      const reportPath = options.resume ? await retryReportPath(pageDir, run) : path.join(pageDir, `run-${run}.json`);
      console.log(`[${options.label}] ${page.name} ${run}/${options.runs}: ${result.url}`);
      if (options.resume) summary.resumeHistory.at(-1).attemptedRuns += 1;
      try {
        await runLighthouse(cli, result.url, reportPath, configPath);
        const report = extractReport(JSON.parse(await readFile(reportPath, "utf8")), result.url, reportPath);
        const settings = JSON.stringify(comparisonSettings(report));
        firstSettings ??= settings;
        if (settings !== firstSettings) throw new Error("Lighthouse version, browser version or measurement settings changed during this batch.");
        result.runs.push({ run, ...report, previousAttempts });
        console.log(`  score=${report.metrics.score.toFixed(0)} LCP=${report.metrics.lcpMs.toFixed(0)}ms transferred=${report.metrics.networkTransferBytes}B`);
      } catch (error) {
        invalidRuns += 1;
        result.runs.push({ run, status: "invalid", reportPath, error: error.message, previousAttempts });
        console.error(`  INVALID: ${error.message}`);
      }
    }
    const valid = result.runs.filter((run) => run.status === "valid");
    result.validRuns = valid.length;
    result.median = valid.length ? Object.fromEntries(Object.keys(valid[0].metrics).map((key) => [key, median(valid.map((run) => run.metrics[key]))])) : null;
    summary.pages.push(result);
    summary.invalidRuns = invalidRuns;
    await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  }
  summary.finishedAt = new Date().toISOString();
  summary.complete = summary.pages.length === pages.length && summary.pages.every((page) => page.runs.length === options.runs && page.validRuns === options.runs);
  summary.invalidRuns = invalidRuns;
  if (earlier) {
    const previousFirst = earlier.pages?.flatMap((page) => page.runs ?? []).find((run) => run.status === "valid");
    const reasons = [];
    if (!earlier.complete || !summary.complete) reasons.push("Both batches must have every requested run valid.");
    if (earlier.baseUrl !== summary.baseUrl || earlier.runsPerPage !== summary.runsPerPage) reasons.push("Base URL or run count differs.");
    if (!previousFirst || JSON.stringify(comparisonSettings(previousFirst)) !== firstSettings) reasons.push("Lighthouse/browser versions or measurement settings differ.");
    const earlierPaths = earlier.pages?.filter((page) => pages.some((current) => current.path === page.path)).map((page) => page.path);
    if (JSON.stringify(earlierPaths) !== JSON.stringify(pages.map((page) => page.path))) reasons.push("Selected page paths/order differ.");
    summary.comparison = { previousSummaryPath: path.resolve(options.compare), comparable: reasons.length === 0, reasons };
    if (!reasons.length) {
      summary.comparison.pages = summary.pages.map((page) => {
        const before = earlier.pages.find((candidate) => candidate.path === page.path).median;
        return { name: page.name, delta: Object.fromEntries(Object.entries(page.median).map(([key, value]) => [key, value - before[key]])) };
      });
    } else {
      process.exitCode = 1;
      console.error(`Comparison refused: ${reasons.join(" ")}`);
    }
  }
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Summary: ${summaryPath} (${invalidRuns ? `${invalidRuns} invalid run(s)` : "all runs valid"})`);
  if (invalidRuns) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
