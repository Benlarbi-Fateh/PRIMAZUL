import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  reactCompiler: isProduction,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.7",
        port: "5001",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
