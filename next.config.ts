import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ["127.0.0.1"],
  redirects() {
    return [
      {
        source: "/blog/cocktail-glassware-buying-guide",
        destination: "/blog/essential-cocktail-glass-types-bars-restaurants",
        permanent: true,
      },
      {
        source: "/case-studies/garbo-hotel-glassware-color-customization",
        destination: "/blog/hotel-glassware-guestrooms-lounges",
        permanent: true,
      },
      {
        source: "/case-studies/glarivo-hotel-glassware-customization",
        destination: "/blog/hotel-glassware-guestrooms-lounges",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.glarivoglass.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
