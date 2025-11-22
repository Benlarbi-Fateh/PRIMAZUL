/** @type {import('next').NextConfig} */ // ce fichier utilise la syntaxe ES module
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: ['res.cloudinary.com'], // autorise les images depuis Cloudinary
  },
};

export default nextConfig;
