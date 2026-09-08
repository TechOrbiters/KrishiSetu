/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Firebase Hosting (free tier)
  // All portals use Supabase client-side SDK so they work without API routes
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'leaflet'],
  },
};

module.exports = nextConfig;
