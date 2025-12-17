/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // <--- désactive Turbopack (corrige ton bug)
  },
  reactCompiler: true,
  images: {
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
    ],
  },
  // OU utiliser domains (déprécié mais plus simple)
  domains: ["localhost", "ui-avatars.com", "192.168.1.7"],
  unoptimized: true,
  // Supprimez complètement la ligne 'domains'
};

export default nextConfig;
