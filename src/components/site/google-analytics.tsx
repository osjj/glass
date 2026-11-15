"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";

const subscribe = () => () => {};
const serverSnapshot = () => false;

export function GoogleAnalytics() {
  // The browser hostname is authoritative; server render never loads the tag.
  const enabled = useSyncExternalStore(subscribe, isAnalyticsEnabled, serverSnapshot);
  if (!enabled) return null;

  // GA4 enhanced measurement handles client-side navigation. Do not also
  // send manual page_view events, which would count those visits twice.
  return (
    <>
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Script
        id="google-analytics-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
