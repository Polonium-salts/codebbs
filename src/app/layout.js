"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { InstallPWA } from "@/components/InstallPWA";

export default function RootLayout({ children, session }) {
  useEffect(() => {
    // 注册service worker
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = '/sw-register.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* PWA 元数据 */}
        <meta name="application-name" content="Forum App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Forum" />
        <meta name="description" content="一个现代化的论坛应用" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        
        {/* PWA 图标 */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/icons/icon-72x72.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/10">
        <ThemeProvider defaultTheme="dark" enableSystem={false}>
          <AuthProvider session={session}>
            {/* Background gradients */}
            <div className="fixed inset-0 -z-10 bg-background">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>
            
            <div className="relative flex min-h-screen">
              <Sidebar />
              <div className="flex w-full flex-1 flex-col">
                <Navbar />
                <main className="flex-1">
                  <div className="container py-6 lg:py-8 lg:pl-72">
                    {children}
                  </div>
                </main>
                <footer className="relative border-t bg-background/50 backdrop-blur-sm lg:pl-72">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <div className="container relative z-10 py-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                      <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Forum App. Built with Next.js and Tailwind CSS.
                      </p>
                      <div className="flex items-center space-x-4">
                        <a
                          href="https://github.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-lg p-2 text-muted-foreground transition-colors hover:text-accent-foreground"
                        >
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <GithubIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                        </a>
                        <a
                          href="https://twitter.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-lg p-2 text-muted-foreground transition-colors hover:text-accent-foreground"
                        >
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <TwitterIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                        </a>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
            
            {/* PWA安装按钮 */}
            <InstallPWA />
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
