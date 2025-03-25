"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

export function PageTransition({ children }) {
  const pathname = usePathname();
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Only animate after the first render
  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  // Skip animation on first render
  if (isFirstRender) {
    return children;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 