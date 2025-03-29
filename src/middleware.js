import { NextResponse } from 'next/server';

// 页面缓存配置
const CACHE_PAGES = [
  { path: '/posts', maxAge: 60 }, // 缓存1分钟
  { path: '/categories', maxAge: 300 }, // 缓存5分钟
  { path: '/users', maxAge: 300 }, // 缓存5分钟
];

// API缓存配置
const CACHE_API = [
  { path: '/api/categories', maxAge: 300 }, // 分类列表缓存5分钟
  { path: '/api/posts', maxAge: 60, methods: ['GET'] }, // 文章列表缓存1分钟
  { path: '/api/search', maxAge: 30, methods: ['GET'] }, // 搜索结果缓存30秒
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();
  
  // 检查是否应该应用缓存
  const shouldCachePage = CACHE_PAGES.find(page => pathname.startsWith(page.path));
  const shouldCacheApi = CACHE_API.find(api => 
    pathname.startsWith(api.path) && 
    (!api.methods || api.methods.includes(request.method))
  );
  
  if (shouldCachePage && request.method === 'GET') {
    // 为公共页面添加缓存控制头
    response.headers.set(
      'Cache-Control',
      `public, max-age=${shouldCachePage.maxAge}, stale-while-revalidate`
    );
  } else if (shouldCacheApi) {
    // 为API响应添加缓存控制头
    response.headers.set(
      'Cache-Control',
      `public, max-age=${shouldCacheApi.maxAge}, stale-while-revalidate`
    );
  }
  
  // 添加安全相关头信息，提高安全性同时也优化性能
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 添加压缩提示
  response.headers.set('Accept-Encoding', 'gzip, deflate, br');
  
  return response;
}

// 仅对这些路由应用中间件
export const config = {
  matcher: [
    // 静态页面
    '/posts/:path*',
    '/categories/:path*',
    '/users/:path*',
    // API路由
    '/api/posts/:path*',
    '/api/categories/:path*',
    '/api/search',
  ],
}; 