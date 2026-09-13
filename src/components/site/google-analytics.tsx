import Script from "next/script";

const measurementId = "G-ZN5MYTQSBP";

export function GoogleAnalytics() {
  // Keep development visits out of the production property.
  if (process.env.NODE_ENV !== "production") return null;

  // GA4 enhanced measurement handles client-side navigation. Do not also
  // send manual page_view events, which would count those visits twice.
  return (
    <>
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
      <Script
        id="google-analytics-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
