/** @type {import('next').NextConfig} */
const nextConfig = {
  // 既存の設定
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  transpilePackages: ['leaflet'],
  experimental: {
    esmExternals: false
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  },

  // ここから下を追加
  async headers() {
    return [
      {
        // /api 以下すべてのルートに CORS ヘッダーを付与する
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin",      value: "https://fast-map-five.vercel.app" },
          { key: "Access-Control-Allow-Methods",     value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers",     value: "Content-Type,Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
  // ここまでを追加
};

module.exports = nextConfig;
