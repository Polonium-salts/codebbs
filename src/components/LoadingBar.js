"use client";

import { useEffect, useState, useRef, memo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// 使用memo包装以避免不必要的重新渲染
export const LoadingBar = memo(function LoadingBar() {
  // 使用useRef存储动画变量和状态，避免不必要的重渲染
  const [isLoading, setIsLoading] = useState(false);
  const progressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const timeoutRef = useRef(null);
  const barRef = useRef(null);
  const activeTransitionRef = useRef(false);
  
  // 监听路由变化
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 避免RSC渲染期间重复监听
  const hasSetupListenersRef = useRef(false);

  // 优化进度加载模拟
  const simulateProgress = () => {
    // 如果不再加载，取消动画帧
    if (!isLoading) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }
    
    // 优化进度增长曲线 - 更快更流畅
    let increment;
    if (progressRef.current < 20) {
      increment = Math.random() * 3; // 开始快速增长
    } else if (progressRef.current < 70) {
      increment = Math.random() * 2.5;
    } else {
      increment = Math.random() * 0.4; // 接近完成时缓慢
    }
    
    // 限制最大进度为96%，剩余部分在完成加载时一次性完成
    if (progressRef.current + increment < 96) {
      progressRef.current += increment;
      
      // 优化DOM操作 - 批量更新减少重排
      if (barRef.current && !activeTransitionRef.current) {
        barRef.current.style.transform = `translateX(${progressRef.current - 100}%)`;
      }
      
      // 请求下一帧
      animationFrameRef.current = requestAnimationFrame(simulateProgress);
    }
  };

  const startLoading = () => {
    // 如果已经在加载或过渡中，避免重复处理
    if (isLoading || activeTransitionRef.current) return;
    
    setIsLoading(true);
    progressRef.current = 0;
    activeTransitionRef.current = false;
    
    // 优化初始状态设置
    if (barRef.current) {
      barRef.current.style.transform = 'translateX(-100%)';
      barRef.current.style.opacity = '1';
    }
    
    // 使用RAF确保动画流畅
    requestAnimationFrame(() => {
      animationFrameRef.current = requestAnimationFrame(simulateProgress);
    });
  };

  const completeLoading = () => {
    // 如果没有在加载，无需完成
    if (!isLoading) return;
    
    // 防止多次触发完成事件
    activeTransitionRef.current = true;
    cancelAnimationFrame(animationFrameRef.current);
    
    // 立即将进度条完成 - 使用transform而不是width提高性能
    if (barRef.current) {
      barRef.current.style.transform = 'translateX(0)';
      
      // 短暂延迟后隐藏进度条
      timeoutRef.current = setTimeout(() => {
        if (barRef.current) {
          barRef.current.style.opacity = '0';
          
          // 重置状态
          setIsLoading(false);
          progressRef.current = 0;
          activeTransitionRef.current = false;
        }
      }, 150);
    }
  };

  // 监听客户端路由变化 - 使用RAF优化事件触发时机
  useEffect(() => {
    if (typeof window === 'undefined' || hasSetupListenersRef.current) return;
    
    // 标记已设置事件监听
    hasSetupListenersRef.current = true;
    
    // 监听导航开始事件 - 使用RAF延迟确保不阻塞主线程
    const handleStart = () => {
      requestAnimationFrame(startLoading);
    };
    
    // 监听导航完成事件
    const handleComplete = () => {
      requestAnimationFrame(completeLoading);
    };
    
    // 绑定Next.js路由事件
    const bindEvents = () => {
      document.addEventListener('routeChangeStart', handleStart);
      document.addEventListener('routeChangeComplete', handleComplete);
      document.addEventListener('routeChangeError', handleComplete);
    };
    
    // 使用RAF确保不阻塞页面加载
    requestAnimationFrame(bindEvents);
    
    // 清理事件监听
    return () => {
      document.removeEventListener('routeChangeStart', handleStart);
      document.removeEventListener('routeChangeComplete', handleComplete);
      document.removeEventListener('routeChangeError', handleComplete);
      
      clearTimeout(timeoutRef.current);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  
  // 观察路由变化，使用防抖处理App Router的过渡
  useEffect(() => {
    if (!hasSetupListenersRef.current) return;
    
    let debounceTimer;
    clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(() => {
      if (!activeTransitionRef.current) {
        startLoading();
        // 短时间内完成加载，减少视觉干扰
        setTimeout(completeLoading, 100);
      }
    }, 10);
    
    return () => clearTimeout(debounceTimer);
  }, [pathname, searchParams]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden">
      <div
        ref={barRef}
        className="h-full w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500 transition-all duration-200 ease-out transform -translate-x-full shadow-[0_0_8px_rgba(124,58,237,0.5)] dark:shadow-[0_0_8px_rgba(139,92,246,0.7)]"
        style={{ opacity: 0 }}
      />
    </div>
  );
}); 