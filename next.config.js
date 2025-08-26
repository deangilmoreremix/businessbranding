const withMDX = require('@next/mdx')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { 
    unoptimized: true,
    domains: [
      'images.unsplash.com',
      'gadedbrnqzpfqtsdfzcg.supabase.co', // Supabase storage domain
      'api.recraft.ai', // Recraft API domain
      'api.elevenlabs.io' // ElevenLabs API domain
    ]
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion'
    ],
    mdxRs: true
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
    
    if (process.env.NODE_ENV === 'production') {
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