"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeoutId;
    let intervalId;
    
    // 路由变化时显示 loading
    const handleStart = () => {
      setIsLoading(true);
      setProgress(10);
      
      // 模拟逐渐增加的进度
      intervalId = setInterval(() => {
        setProgress(prev => {
          // 随机增加进度，但不超过95%
          const random = Math.floor(Math.random() * 15);
          const nextProgress = prev + random;
          return nextProgress > 95 ? 95 : nextProgress;
        });
      }, 300);
    };
    
    // 路由加载完成时隐藏 loading
    const handleComplete = () => {
      // 模拟完成进度
      setProgress(100);
      
      // 清除间隔定时器
      if (intervalId) clearInterval(intervalId);
      
      // 等待过渡动画完成后隐藏
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    };
    
    // 启动初始 loading
    handleStart();
    
    // 300ms 后自动完成，因为我们正在监听 pathname 和 searchParams
    timeoutId = setTimeout(handleComplete, 300);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [pathname, searchParams]);
  
  if (!isLoading && progress === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <motion.div
        className="h-full bg-primary"
        style={{ width: `${progress}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      />
    </div>
  );
} 