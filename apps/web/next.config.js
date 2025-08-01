const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com'], // Add your image domains here
  },
  env: {
    API_URL: process.env.API_URL, // Add your API URL here
    WHATSAPP_API_URL: process.env.WHATSAPP_API_URL, // WhatsApp API URL
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
};

module.exports = nextConfig;