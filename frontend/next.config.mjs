/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,   // <--- désactive Turbopack (corrige ton bug)
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
  },
  // Supprimez complètement la ligne 'domains'
};

export default nextConfig;