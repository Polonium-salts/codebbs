"use client";

import { useTranslation } from '@/components/LanguageProvider';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { currentLanguage, switchLanguage, availableLanguages } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 获取当前语言信息
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];

  // 处理点击事件以关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-1 text-sm hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded-md transition-colors"
        aria-label="Change language"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border/50 overflow-hidden z-50">
          <div className="py-1">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                className={`flex items-center w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                  language.code === currentLanguage ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  switchLanguage(language.code);
                  setShowDropdown(false);
                }}
              >
                <span className="mr-2 text-lg">{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 