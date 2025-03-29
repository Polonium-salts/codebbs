"use client";

import "./globals.css";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from '@/components/ThemeProvider'
import LanguageProvider from '@/components/LanguageProvider'
import { SocketProvider } from "@/lib/socketClient";
import { Sidebar } from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { InstallPWA } from "@/components/InstallPWA";
import { Toaster } from "react-hot-toast";
import { PageTransition } from "@/components/PageTransition";
import { LoadingBar } from "@/components/LoadingBar";
import { getUserLanguage } from "@/lib/languageUtils";
import { fetchSettings } from "@/lib/settings";
import { X } from "lucide-react";

// 使用memo优化公告组件，只在公告内容变化时重新渲染
const Announcement = memo(({ announcement, onClose }) => {
  if (!announcement.enabled || !announcement.text) return null;
  
  return (
    <div 
      className="relative px-4 py-2 text-center text-sm"
      style={{
        backgroundColor: announcement.bgColor || '#f3f4f6',
        color: announcement.textColor || '#374151'
      }}
    >
      <div className="container flex items-center justify-between">
        <div className="flex-1" dangerouslySetInnerHTML={{ __html: announcement.text }} />
        <button 
          onClick={onClose} 
          className="ml-2 p-1 rounded-full hover:bg-black/10"
          aria-label="关闭公告"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

Announcement.displayName = 'Announcement';

// 优化背景组件
const BackgroundGrid = memo(() => (
  <div className="fixed inset-0 -z-10 bg-background will-change-transform">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] transform-gpu" />
    <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-60" />
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-60" />
  </div>
));

BackgroundGrid.displayName = 'BackgroundGrid';

// 使用memo优化主内容区域，减少不必要的重渲染
const MainContent = memo(({ children, siteSettings }) => (
  <div className="flex w-full flex-1 flex-col">
    <Navbar siteSettings={siteSettings} />
    <main className="flex-1">
      <div className="container py-6 lg:py-8 lg:pl-72">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </main>
  </div>
));

MainContent.displayName = 'MainContent';

export default function RootLayout({ children, session }) {
  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState({
    siteName: '编程交流社区',
    siteDescription: '',
    headerTitle: '',
    faviconUrl: '',
    enableAnnouncement: false,
    announcementText: '',
    announcementBgColor: '#f3f4f6',
    announcementTextColor: '#374151'
  });
  
  // 使用useMemo缓存公告配置，避免不必要的重新计算
  const announcement = useMemo(() => ({
    enabled: settings.enableAnnouncement,
    text: settings.announcementText,
    bgColor: settings.announcementBgColor,
    textColor: settings.announcementTextColor
  }), [
    settings.enableAnnouncement,
    settings.announcementText, 
    settings.announcementBgColor, 
    settings.announcementTextColor
  ]);

  // 优化公告关闭处理函数，使用useCallback避免重新创建
  const closeAnnouncement = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enableAnnouncement: false
    }));
  }, []);

  // 优化设置加载，避免不必要的重复加载
  useEffect(() => {
    // 获取当前语言
    const userLang = getUserLanguage();
    setLanguage(userLang);

    // 获取系统设置 - 启用abortController避免内存泄漏
    let isMounted = true;
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const settingsData = await fetchSettings(controller.signal);
        if (isMounted) {
          setSettings(settingsData);
          
          // 一次性批量更新DOM元素
          if (typeof window !== 'undefined') {
            // 设置favicon
            if (settingsData.faviconUrl) {
              const faviconLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
              faviconLinks.forEach(link => {
                link.href = settingsData.faviconUrl;
              });
            }
            
            // 设置标题
            if (settingsData.siteName) {
              document.title = settingsData.siteName;
            }
            
            // 设置meta描述
            if (settingsData.siteDescription) {
              const metaDesc = document.querySelector('meta[name="description"]');
              if (metaDesc) {
                metaDesc.content = settingsData.siteDescription;
              }
            }
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('加载设置失败:', error);
        }
      }
    }
    
    loadSettings();

    // 延迟注册service worker，优先渲染主UI
    if (typeof window !== 'undefined') {
      requestIdleCallback(() => {
        const script = document.createElement('script');
        script.src = '/sw-register.js';
        script.async = true;
        document.body.appendChild(script);
      });
    }
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* 网站元数据 */}
        <meta name="application-name" content={settings.siteName || "Forum App"} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={settings.siteName || "Forum"} />
        <meta name="description" content={settings.siteDescription || "一个现代化的论坛应用"} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        
        {/* PWA 图标 */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.png" />
        <link rel="icon" type="image/png" sizes="32x32" href={settings.faviconUrl || "/icons/icon-72x72.png"} />
        <link rel="icon" type="image/png" sizes="16x16" href={settings.faviconUrl || "/icons/icon-72x72.png"} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href={settings.faviconUrl || "/icons/icon-72x72.png"} />
        
        {/* 动态标题 */}
        <title>{settings.siteName || "编程交流社区"}</title>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/10">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider session={session}>
            <LanguageProvider>
              <SocketProvider>
                {/* 网站公告 */}
                <Announcement 
                  announcement={announcement} 
                  onClose={closeAnnouncement}
                />
                
                {/* 添加顶部加载进度条 */}
                <LoadingBar />
                
                {/* 优化的背景网格 */}
                <BackgroundGrid />
                
                <div className="relative flex min-h-screen">
                  {/* Sidebar - 保持静态不参与过渡动画 */}
                  <Sidebar siteSettings={settings} />
                  
                  {/* 内容区域 - 应用过渡动画 */}
                  <MainContent siteSettings={settings}>
                    {children}
                  </MainContent>
                </div>
                
                {/* PWA安装按钮 */}
                <InstallPWA />
                
                {/* Toast通知 */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    },
                    success: {
                      icon: '✅',
                    },
                    error: {
                      icon: '❌',
                    },
                  }}
                />
              </SocketProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function GithubIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}
