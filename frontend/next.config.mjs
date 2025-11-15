/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: ['http://localhost:3000', 'http://192.168.176.1:3000'],
  },
};

export default nextConfig;
