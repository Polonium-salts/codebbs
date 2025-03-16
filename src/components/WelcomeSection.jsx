"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WelcomeSection() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从localStorage加载用户偏好设置
  useEffect(() => {
    const storedVisibility = localStorage.getItem('welcomeSectionVisible');
    if (storedVisibility !== null) {
      setIsVisible(storedVisibility === 'true');
    }
    setIsLoaded(true);
  }, []);

  // 切换欢迎组件的可见性
  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('welcomeSectionVisible', newVisibility.toString());
  };

  // 如果还没有加载用户偏好，不渲染任何内容以避免闪烁
  if (!isLoaded) {
    return null;
  }

  return (
    <div className="relative">
      {/* 显示/隐藏按钮 */}
      <button
        onClick={toggleVisibility}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all shadow-md"
        aria-label={isVisible ? "隐藏欢迎信息" : "显示欢迎信息"}
        title={isVisible ? "隐藏欢迎信息" : "显示欢迎信息"}
      >
        {isVisible ? (
          <EyeOffIcon className="w-5 h-5" />
        ) : (
          <EyeIcon className="w-5 h-5" />
        )}
      </button>

      {/* 欢迎组件内容 */}
      {isVisible ? (
        <div className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="relative z-10 px-6 py-12 md:py-16 lg:py-20 max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">欢迎来到Cereals</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">分享你的想法，探索新的知识，和社区一起成长。</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/posts/create" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all">
                创建新讨论
              </Link>
              <Link href="/categories" className="px-6 py-3 bg-blue-700 bg-opacity-30 text-white border border-white border-opacity-20 rounded-lg hover:bg-opacity-40 transition-all">
                浏览分类
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleVisibility}
          className="w-full py-4 rounded-xl border border-dashed border-border/60 bg-card/50 hover:bg-card/80 text-primary transition-colors flex items-center justify-center gap-2"
        >
          <EyeIcon className="w-5 h-5" />
          <span>显示欢迎信息</span>
        </button>
      )}
    </div>
  );
}

// 图标组件
function EyeIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
} 