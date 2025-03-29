/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // 使用SWC进行更快的代码压缩
  images: {
    domains: ['ui-avatars.com', 'avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compress: true, // 启用gzip压缩
  poweredByHeader: false, // 移除X-Powered-By头，减小响应大小
  productionBrowserSourceMaps: false, // 生产环境禁用源映射
  optimizeFonts: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    optimizeCss: true, // 启用CSS优化
    scrollRestoration: true, // 改善页面导航时的滚动恢复
    legacyBrowsers: false, // 不支持过旧的浏览器，减少包体积
  },
  // 自定义webpack配置
  webpack: (config, { dev, isServer }) => {
    // 启用模块连接
    config.optimization.concatenateModules = true;
    
    // 生产环境中增加资源压缩
    if (!dev) {
      config.optimization.minimize = true;
    }
    
    // 让服务端渲染可以处理svg文件
    if (isServer) {
      config.externals = [...config.externals, 'canvas', 'jsdom'];
    }
    
    return config;
  },
};

module.exports = nextConfig; 