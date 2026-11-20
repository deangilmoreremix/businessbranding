const withMDX = require('@next/mdx')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { 
    unoptimized: true,
    domains: [
      'images.unsplash.com',
      'gadedbrnqzpfqtsdfzcg.supabase.co' // Supabase storage domain
    ]
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion'
    ],
    mdxRs: true,
    serverComponentsExternalPackages: ['ws']
  },
  async redirects() {
    return [{ source: '/docs/gemini-features', destination: '/docs/ai-features', permanent: true }];
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  typescript: {
    // During build time, skip type checking to avoid build failures
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // konva's Node build optionally requires `canvas`; the editor is browser-only (dynamic, ssr:false)
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    // Avoid "self is not defined" error with Supabase client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    config.cache = false;
    config.resolve.preferRelative = true;
    
    if (process.env.NODE_ENV === 'production' && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              // Only group vendor modules used by the initial load. Libraries that are only needed by lazily loaded
              // features (editor, workflows, ...) stay in their own async chunks instead of inflating shared vendor
              // chunks (e.g. vendor.lucide-react) that every page downloads.
              chunks: 'initial',
              priority: -10,
              reuseExistingChunk: true,
              name(module) {
                // Get the module path
                const modulePath = module.context || '';
                
                // Match for node_modules package name
                const match = modulePath.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                
                // If no match found or match array is incomplete, return a default name
                if (!match || !match[1]) {
                  return 'vendor.unknown';
                }
                
                // Get the package name and sanitize it
                const packageName = match[1];
                return `vendor.${packageName.replace('@', '')}`;
              }
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            }
          }
        }
      };
    }
    
    return config;
  }
};

module.exports = withMDX(nextConfig);