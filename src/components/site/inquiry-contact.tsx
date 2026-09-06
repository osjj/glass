"use client";

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { ChatTeardropText, EnvelopeSimple, WhatsappLogo } from "@phosphor-icons/react";
import { inquirySchema, SALES_EMAIL, SALES_WHATSAPP, type InquiryContext } from "@/lib/inquiries";
import styles from "./inquiry-contact.module.css";

const InquiryContextValue = createContext<(product?: InquiryContext) => void>(() => {});

export function InquiryButton({ children, className, product }: { children: ReactNode; className?: string; product?: InquiryContext }) {
  const open = useContext(InquiryContextValue);
  return <button type="button" className={className} onClick={() => open(product)} aria-haspopup="dialog">{children}</button>;
}

export function InquiryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [request, setRequest] = useState<{ id: string; product?: InquiryContext } | null>(null);
  function open(product?: InquiryContext) { setRequest({ id: crypto.randomUUID(), product }); }
  return <InquiryContextValue.Provider value={open}>
    {children}
    {pathname === "/" && <aside className={styles.rail} aria-label="Contact sales">
      <a href={`mailto:${SALES_EMAIL}`} title={SALES_EMAIL}><EnvelopeSimple size={25} weight="regular" aria-hidden="true" /><span>Email</span></a>
      <a className={styles.whatsapp} href={SALES_WHATSAPP} target="_blank" rel="noopener noreferrer" title="WhatsApp +86 18825913441"><WhatsappLogo size={27} weight="regular" aria-hidden="true" /><span>WhatsApp</span></a>
      <button className={styles.inquire} type="button" onClick={() => open()} aria-haspopup="dialog"><ChatTeardropText size={25} weight="regular" aria-hidden="true" /><span>Inquire</span></button>
    </aside>}
    {request && <InquiryModal key={request.id} submissionId={request.id} product={request.product} sourcePath={pathname} onClose={() => setRequest(null)} />}
  </InquiryContextValue.Provider>;
}

function InquiryModal({ submissionId, product, sourcePath, onClose }: { submissionId: string; product?: InquiryContext; sourcePath: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState({ email: "", countryCode: "", phone: "", name: "", companyName: "", message: product ? `I am interested in ${product.name}${product.sku ? ` (Item No. ${product.sku})` : ""}. Quantity: ` : "", website: "" });

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; document.documentElement.style.overflow = previousRootOverflow; previousFocus?.focus(); };
  }, []);

  function change(field: keyof typeof values, value: string) { setValues((current) => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const parsed = inquirySchema.safeParse({ ...values, email: values.email.trim(), submissionId, sourcePath });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    submitting.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Your request could not be saved. Please try again.");
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The request timed out. Please retry; your inquiry will not be saved twice.");
    } finally { submitting.current = false; setBusy(false); }
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="inquiry-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className={styles.panel}>
      <button type="button" className={styles.close} aria-label="Close inquiry" disabled={busy} onClick={onClose}><X size={23} /></button>
      {success ? <div className={styles.success} role="status">
        <CheckCircle2 size={48} aria-hidden="true" />
        <p className={styles.kicker}>REQUEST RECEIVED</p>
        <h2 id="inquiry-title">Thank you for your inquiry.</h2>
        <p>Your request has been saved. Our team will respond to <strong>{values.email}</strong> within one business day.</p>
        <button type="button" className={styles.submit} onClick={onClose}>Back to browsing <ArrowRight size={18} /></button>
      </div> : <>
        <p className={styles.kicker}>— GET INSTANT QUOTE</p>
        <h2 id="inquiry-title">Tell us what you need.<br />We respond within 24 hours.</h2>
        {product && <p className={styles.product}>{product.name}{product.sku ? ` · ${product.sku}` : ""}</p>}
        <form onSubmit={submit}>
          <fieldset disabled={busy} className={styles.fields}>
            <label className={styles.field}><span>Email <b>*</b></span><div className={styles.inputWrap}>
              <input autoFocus name="email" type="email" autoComplete="email" required maxLength={100} placeholder="you@company.com" value={values.email} onChange={(e) => change("email", e.target.value)} />
              <small>{values.email.length}/100</small>
            </div></label>
            <div className={styles.field}><label htmlFor="inquiry-phone">Mobile/WhatsApp <em>(optional)</em></label>
              <div className={styles.phoneRow}>
                <input name="countryCode" aria-label="Country calling code" type="tel" list="inquiry-country-codes" placeholder="Code" autoComplete="tel-country-code" maxLength={5} value={values.countryCode} onChange={(e) => change("countryCode", e.target.value)} />
                <datalist id="inquiry-country-codes">
                  {[["+1", "US / Canada"], ["+44", "UK"], ["+86", "China"], ["+91", "India"], ["+971", "UAE"], ["+966", "Saudi Arabia"], ["+20", "Egypt"], ["+49", "Germany"], ["+33", "France"], ["+61", "Australia"], ["+55", "Brazil"], ["+27", "South Africa"], ["+234", "Nigeria"], ["+7", "Russia / Kazakhstan"], ["+90", "Türkiye"], ["+62", "Indonesia"], ["+60", "Malaysia"], ["+65", "Singapore"], ["+81", "Japan"], ["+82", "South Korea"]].map(([code, country]) => <option key={code} value={code}>{country}</option>)}
                </datalist>
                <div className={styles.inputWrap}><input id="inquiry-phone" name="phone" type="tel" autoComplete="tel-national" maxLength={100} placeholder="Please enter your mobile phone" value={values.phone} onChange={(e) => change("phone", e.target.value)} /><small>{values.phone.length}/100</small></div>
              </div>
              <p className={styles.hint}>Select or enter your country code, e.g. +86.</p>
            </div>
            <label className={styles.field}><span>Name <b>*</b></span><div className={styles.inputWrap}><input name="name" autoComplete="name" required maxLength={100} placeholder="Please enter your name" value={values.name} onChange={(e) => change("name", e.target.value)} /><small>{values.name.length}/100</small></div></label>
            <label className={styles.field}><span>Company name <em>(optional)</em></span><div className={styles.inputWrap}><input name="companyName" autoComplete="organization" maxLength={200} placeholder="Please enter your company name" value={values.companyName} onChange={(e) => change("companyName", e.target.value)} /><small>{values.companyName.length}/200</small></div></label>
            <label className={styles.field}><span>Message <b>*</b></span><div className={styles.inputWrap}><textarea name="message" required maxLength={1000} rows={4} placeholder="Which products are you interested in? And what is the quantity?" value={values.message} onChange={(e) => change("message", e.target.value)} /><small>{values.message.length}/1000</small></div></label>
            <label className={styles.trap} aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={(e) => change("website", e.target.value)} /></label>
          </fieldset>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit Request"}<ArrowRight size={20} aria-hidden="true" /></button>
          <p className={styles.footnote}>✓ We respond within one business day</p>
          <p className={styles.privacy}>We use your contact details to respond to this inquiry.</p>
        </form>
      </>}
    </div>
  </dialog>;
}
