export const GA_MEASUREMENT_ID = "G-ZN5MYTQSBP";
export type LeadContext = { submissionId: string; sourcePath: string; productSlug?: string };
export type ContactContext = { contactMethod: "email" | "whatsapp" | "phone"; contactLocation: "header" | "rail" | "footer" };

declare global {
  interface Window {
    gtag?: (command: "event", name: string, parameters: Record<string, string>) => void;
  }
}

const officialHosts = new Set(["glarivoglass.com", "www.glarivoglass.com"]);
const trackedLeadIds = new Set<string>();

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAnalyticsEnabled() {
  return process.env.NODE_ENV === "production"
    && typeof window !== "undefined"
    && officialHosts.has(window.location.hostname)
    && !isAdminPath(window.location.pathname);
}

function safeSourcePath(value: string) {
  const pathname = value.split(/[?#]/, 1)[0];
  return pathname.length <= 500 && /^\/(?!\/)[^\\\s]*$/.test(pathname) && !isAdminPath(pathname) ? pathname : null;
}

function sendEvent(name: "generate_lead" | "contact_click", parameters: Record<string, string>) {
  try {
    if (!isAnalyticsEnabled() || typeof window.gtag !== "function") return false;
    window.gtag("event", name, { send_to: GA_MEASUREMENT_ID, ...parameters });
    // Success means queued locally, not confirmed delivery to Google Analytics.
    return true;
  } catch {
    // Analytics must never interrupt a saved inquiry or native link navigation.
    return false;
  }
}

export function trackGenerateLead({ submissionId, sourcePath, productSlug }: LeadContext) {
  const source = safeSourcePath(sourcePath);
  if (!submissionId || !source || trackedLeadIds.has(submissionId)) return false;
  const slug = productSlug && productSlug.length <= 200 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productSlug) ? productSlug : undefined;
  const sent = sendEvent("generate_lead", {
    form_id: "inquiry_form",
    lead_type: slug ? "product" : "general",
    source_path: source,
    ...(slug ? { product_slug: slug } : {}),
  });
  if (sent) trackedLeadIds.add(submissionId);
  return sent;
}

export function trackContactClick({ contactMethod, contactLocation }: ContactContext) {
  if (typeof window === "undefined") return false;
  const source = safeSourcePath(window.location.pathname);
  if (!source) return false;
  return sendEvent("contact_click", {
    contact_method: contactMethod,
    contact_location: contactLocation,
    source_path: source,
  });
}
