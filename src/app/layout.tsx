import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-home-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-home-display",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${manrope.variable} ${cormorant.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}
