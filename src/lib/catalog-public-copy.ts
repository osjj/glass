// Source provenance stays in import records; public copy must not adopt a supplier's identity.
export const CATALOG_REVIEWED_COPY_MARKER = "[Glarivo public copy reviewed: 2026-09-09]";

export function cleanCatalogLabel(value: string): string {
  return value.replace(/\bgarbo(?:glass)?(?:\s+international)?(?:['’]s)?\b/gi, "")
    .replace(/ {2,}/g, " ").trim();
}

export function hasSupplierVoice(value: string): boolean {
  return /garbo|\b(?:we|our|ours|us|oasis creations)\b|\b(?:(?:design|designer)s? team|sales team|professional manufacturer)\b|\bthe factory (?:offers|is suitable for large orders)\b|\bChina Factory Excellence\b/i.test(value);
}

export function cleanCatalogBody(value: string): string {
  if (!hasSupplierVoice(value)) return value;
  // Drop complete source paragraphs instead of relabeling supplier promises as Glarivo's.
  return value.split(/\r?\n/).filter((paragraph) => !hasSupplierVoice(paragraph)).join("\n").trim();
}
