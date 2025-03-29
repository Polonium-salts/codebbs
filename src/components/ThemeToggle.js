"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "./LanguageProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const isChangingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = () => {
    if (isChangingRef.current) return;
    isChangingRef.current = true;
    
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    setTimeout(() => {
      isChangingRef.current = false;
    }, 250);
  };

  if (!mounted) {
    return (
      <button
        className="group relative inline-flex items-center justify-center rounded-md w-9 h-9 bg-transparent"
        disabled
      >
        <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="sr-only">{t('common.darkMode')}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="4" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleThemeChange}
      className="group relative inline-flex items-center justify-center rounded-md w-9 h-9 text-muted-foreground hover:text-accent-foreground"
      aria-label={theme === "dark" ? t('common.lightMode') : t('common.darkMode')}
      title={theme === "dark" ? t('common.lightMode') : t('common.darkMode')}
      style={{ 
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <span className="sr-only">{theme === "dark" ? t('common.lightMode') : t('common.darkMode')}</span>
      
      <div className="relative h-5 w-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 absolute inset-0"
          style={{
            opacity: theme === "dark" ? 0 : 1,
            transform: theme === "dark" ? "scale(0.5) rotate(-45deg)" : "scale(1) rotate(0)",
            transition: "transform 0.15s ease, opacity 0.15s ease"
          }}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 absolute inset-0"
          style={{
            opacity: theme === "dark" ? 1 : 0,
            transform: theme === "dark" ? "scale(1) rotate(0)" : "scale(0.5) rotate(45deg)",
            transition: "transform 0.15s ease, opacity 0.15s ease"
          }}
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </div>
    </button>
  );
} 