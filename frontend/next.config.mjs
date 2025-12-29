/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Désactivation propre de la configuration expérimentale Turbo
  experimental: {},

  // ✅ Désactiver le Strict Mode aide à stabiliser Agora en développement
  reactStrictMode: false,

  images: {
    // ✅ Autoriser les fichiers SVG (nécessaire pour ui-avatars)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // ✅ Indispensable pour éviter les erreurs 404 sur les vieux liens d'images
    unoptimized: true,

    // ✅ Liste des domaines autorisés
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
};

export default nextConfig;
