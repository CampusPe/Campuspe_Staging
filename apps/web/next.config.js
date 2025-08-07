const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  images: {
    domains: ['example.com'], // Add your image domains here
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL, // Add your API URL here
    WHATSAPP_API_URL: process.env.WHATSAPP_API_URL, // WhatsApp API URL
  },
  // Optimize for Azure App Service
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },
  // Azure App Service compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;