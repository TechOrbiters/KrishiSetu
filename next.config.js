const isStatic = process.env.STATIC_EXPORT === "true" || process.env.STATIC_EXPORT?.trim() === "true";

const nextConfig = {
  ...(isStatic ? { output: "export" } : {}),
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "leaflet"],
  },
};

module.exports = nextConfig;
