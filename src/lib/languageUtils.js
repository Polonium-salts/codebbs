"use client";

import { useState, useEffect } from 'react';
import enUS from '@/locales/en-US.json';
import zhCN from '@/locales/zh-CN.json';
import languageConfig from '@/locales/languages.json';

// 默认语言数据
const defaultLanguageData = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/**
 * 获取浏览器语言
 * @returns {string} 浏览器语言代码
 */
export function getBrowserLanguage() {
  if (typeof window === 'undefined') return languageConfig.defaultLanguage;
  
  const browserLang = navigator.language || navigator.userLanguage;
  const availableLangs = languageConfig.availableLanguages.map(lang => lang.code);
  
  if (availableLangs.includes(browserLang)) {
    return browserLang;
  }
  
  // 处理子语言, 例如 zh-HK 会使用 zh-CN
  const mainLang = browserLang.split('-')[0];
  const mainLangMatch = availableLangs.find(lang => lang.startsWith(mainLang));
  
  if (mainLangMatch) {
    return mainLangMatch;
  }
  
  return languageConfig.defaultLanguage;
}

/**
 * 获取格式化文本
 * @param {object} translations 翻译对象
 * @param {string} key 翻译键
 * @param {object} params 替换参数
 * @returns {string} 格式化后的文本
 */
export function formatMessage(translations, key, params = {}) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }
  
  if (typeof value === 'string') {
    return Object.entries(params).reduce((acc, [param, val]) => {
      return acc.replace(new RegExp(`{${param}}`, 'g'), val);
    }, value);
  }
  
  return key;
}

/**
 * 加载语言文件
 * @param {string} language 语言代码
 * @returns {object} 语言数据
 */
export async function loadLanguage(language) {
  // 如果是默认支持的语言直接返回
  if (defaultLanguageData[language]) {
    return defaultLanguageData[language];
  }
  
  try {
    // 尝试从后端 API 加载语言文件
    const response = await fetch(`/api/languages/${language}`);
    if (!response.ok) throw new Error('Language not found');
    return await response.json();
  } catch (error) {
    console.error(`Error loading language ${language}:`, error);
    // 加载失败时返回默认语言
    return defaultLanguageData[languageConfig.defaultLanguage];
  }
}

/**
 * 切换语言
 * @param {string} language 目标语言代码
 */
export function setUserLanguage(language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userLanguage', language);
  }
}

/**
 * 获取用户当前语言
 * @returns {string} 用户当前语言代码
 */
export function getUserLanguage() {
  if (typeof window === 'undefined') return languageConfig.defaultLanguage;
  
  const savedLanguage = localStorage.getItem('userLanguage');
  if (savedLanguage) return savedLanguage;
  
  return getBrowserLanguage();
}

/**
 * 获取所有可用语言
 * @returns {Array} 可用语言列表
 */
export function getAvailableLanguages() {
  return languageConfig.availableLanguages;
}

/**
 * 获取语言名称
 * @param {string} code 语言代码
 * @returns {string} 语言名称
 */
export function getLanguageName(code) {
  const language = languageConfig.availableLanguages.find(lang => lang.code === code);
  return language ? language.name : code;
}

/**
 * 使用语言数据和工具函数的钩子
 * @returns {object} 语言数据和工具函数
 */
export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState(languageConfig.defaultLanguage);
  const [translations, setTranslations] = useState(defaultLanguageData[languageConfig.defaultLanguage]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载用户语言
  useEffect(() => {
    const userLang = getUserLanguage();
    setCurrentLanguage(userLang);
    
    async function loadUserLanguage() {
      setIsLoading(true);
      const langData = await loadLanguage(userLang);
      setTranslations(langData);
      setIsLoading(false);
    }
    
    loadUserLanguage();
  }, []);

  // 切换语言
  const switchLanguage = async (language) => {
    setIsLoading(true);
    setUserLanguage(language);
    setCurrentLanguage(language);
    
    const langData = await loadLanguage(language);
    setTranslations(langData);
    setIsLoading(false);
  };

  // 获取翻译文本
  const t = (key, params = {}) => {
    return formatMessage(translations, key, params);
  };

  return {
    currentLanguage,
    switchLanguage,
    t,
    isLoading,
    availableLanguages: getAvailableLanguages()
  };
} 