import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
