import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Makes Cloudflare bindings available when developing with `next dev`.
// OpenNext's production build does not need a local Hyperdrive connection.
if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  // `pg` conditionally loads pg-cloudflare in Workers. Include the complete
  // package in Next's output trace so OpenNext can bundle that runtime branch.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // Cloudflare Workers has no Next image optimizer: /_next/image passes the
    // original file through with an uncacheable response. Serve pre-optimized
    // static assets directly instead (cached via public/_headers). Revisit if
    // Cloudflare Image Transformations gets enabled on the zone.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Payment receipts are uploaded as base64 data URLs from the checkout
      // (InstaPay / Vodafone Cash). The 1MB default breaks any real phone photo.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
