import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://glarivo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Glarivo Glassware | Clear collections for confident sourcing",
    template: "%s | Glarivo",
  },
  description:
    "Explore focused Glarivo glassware collections and practical product sourcing guides.",
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Glarivo Glassware",
    title: "Glarivo Glassware | Clear collections for confident sourcing",
    description:
      "A focused glassware catalog and practical sourcing knowledge hub.",
    url: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#102a59",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
