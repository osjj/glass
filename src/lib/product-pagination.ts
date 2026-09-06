export const PRODUCTS_PER_PAGE = 30;

export function getPageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getProductPagination(total: number, requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const page = Math.min(
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages,
  );
  const skip = (page - 1) * PRODUCTS_PER_PAGE;
  return { total, page, totalPages, skip, start: total ? skip + 1 : 0, end: Math.min(skip + PRODUCTS_PER_PAGE, total) };
}

export function productPageHref(path: string, page: number, filters: Record<string, string> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return params.size ? `${path}?${params}` : path;
}

export function getVisiblePages(page: number, totalPages: number) {
  const pages = new Set([1, totalPages]);
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  for (let current = start; current <= Math.min(totalPages, start + 2); current++) pages.add(current);
  return [...pages].sort((a, b) => a - b);
}
