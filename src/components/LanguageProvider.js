"use client";

import { createContext, useContext, useEffect } from 'react';
import { useLanguage } from '@/lib/languageUtils';

// 创建语言上下文
export const LanguageContext = createContext({
  currentLanguage: '',
  switchLanguage: () => {},
  t: () => '',
  isLoading: true,
  availableLanguages: []
});

// 语言提供者组件
export default function LanguageProvider({ children }) {
  const languageUtils = useLanguage();
  
  // 当语言变化时更新 HTML lang 属性
  useEffect(() => {
    if (typeof document !== 'undefined' && languageUtils.currentLanguage) {
      document.documentElement.lang = languageUtils.currentLanguage;
    }
  }, [languageUtils.currentLanguage]);

  return (
    <LanguageContext.Provider value={languageUtils}>
      {children}
    </LanguageContext.Provider>
  );
}

// 使用语言的钩子函数
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
} 