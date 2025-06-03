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
          { key: "Access-Control-Allow-Origin", value: "https://fast-6ir0sv4r8-marumo333s-projects.vercel.app" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
          { key: "Vary", value: "Origin" }
        ],
      },
    ];
  },
  // ここまでを追加
};

module.exports = nextConfig;
