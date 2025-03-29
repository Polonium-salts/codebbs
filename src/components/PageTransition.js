"use client";

import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const PageTransition = memo(function PageTransition({ children }) {
  const pathname = usePathname();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const prevPathRef = useRef(pathname);
  
  useEffect(() => {
    // 初始渲染后立即设置为false
    if (isInitialRender) {
      setIsInitialRender(false);
    }
    prevPathRef.current = pathname;
  }, [pathname, isInitialRender]);
  
  // 在初始渲染时不使用动画，提高首屏加载速度
  if (isInitialRender) {
    return <>{children}</>;
  }
  
  // 优化动画配置 - 更快的过渡时间和硬件加速
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0.9, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ 
          duration: 0.12,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{ 
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          perspective: 1000,
          transformStyle: 'preserve-3d'
        }}
        className="w-full page-transition animate-gpu dark:text-opacity-90"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}); 