import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ["127.0.0.1"],
  redirects() {
    return [
      {
        source: "/case-studies/garbo-hotel-glassware-color-customization",
        destination: "/case-studies/glarivo-hotel-glassware-customization",
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
