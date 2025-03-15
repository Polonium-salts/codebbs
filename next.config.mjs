import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {};

// 配置PWA
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);

export default pwaConfig;
