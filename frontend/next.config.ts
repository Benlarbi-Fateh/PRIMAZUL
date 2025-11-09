/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // Important : permet d'utiliser le dossier app/
  },
};

module.exports = nextConfig;
