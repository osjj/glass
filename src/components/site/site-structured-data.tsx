import {
  SALES_EMAIL,
  SALES_TELEPHONES,
  SITE_ALTERNATE_NAME,
  SITE_NAME,
} from "@/lib/site-identity";
import { getSiteUrl } from "@/lib/site-url";

export function SiteStructuredData() {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const logoUrl = `${siteUrl}/brand/glarivo-logo-blue.png`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: `${siteUrl}/`,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          contentUrl: logoUrl,
          width: 1378,
          height: 748,
        },
        email: SALES_EMAIL,
        telephone: SALES_TELEPHONES,
        address: {
          "@type": "PostalAddress",
          addressRegion: "Guangdong",
          addressCountry: "CN",
        },
        contactPoint: SALES_TELEPHONES.map((telephone) => ({
          "@type": "ContactPoint",
          contactType: "sales",
          telephone,
          email: SALES_EMAIL,
        })),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${siteUrl}/`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        publisher: { "@id": organizationId },
        inLanguage: "en",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}

