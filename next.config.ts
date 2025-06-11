/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // App Routerを使用していることを明示
  experimental: {
    typedRoutes: false,
  },
  images: {
    domains: ['images.microcms-assets.io'], // MicroCMSの画像ドメイン
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.microcms-assets.io',
        pathname: '/**',
      },
      // 必要に応じて他のドメインも追加
    ],
    // dangerouslyAllowSVG: true,  // 必要な場合のみ
  },
  // その他の設定
};

export default nextConfig;