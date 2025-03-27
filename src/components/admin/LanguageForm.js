"use client";

import { useState, useRef } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { AlertTriangle } from 'lucide-react';

export default function LanguageForm({ language, onSubmit, isSubmitting }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    code: language?.code || '',
    name: language?.name || '',
    flag: language?.flag || '',
    isDefault: language?.isDefault || false
  });
  const [error, setError] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    // 从文件名中尝试提取语言代码
    if (!formData.code && file.name) {
      const nameMatch = file.name.match(/^([a-z]{2}[-_][A-Z]{2})\.json$/);
      if (nameMatch) {
        setFormData(prev => ({
          ...prev,
          code: nameMatch[1].replace('_', '-')
        }));
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        // 验证是否为有效的JSON
        JSON.parse(content);
        setFileContent(content);
      } catch (err) {
        console.error('JSON解析错误:', err);
        setError(t('admin.jsonParseError'));
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.code) {
      setError(t('admin.codeRequired'));
      return;
    }

    if (!formData.name) {
      setError(t('admin.nameRequired'));
      return;
    }

    if (!fileContent && !language?.content) {
      setError(t('admin.contentRequired'));
      return;
    }

    onSubmit({
      ...formData,
      content: fileContent || language?.content
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="code">
            {t('admin.languageCode')} <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            name="code"
            type="text"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="zh-CN"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('admin.codeFormat')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            {t('admin.languageName')} <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="简体中文"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="flag">
            {t('admin.flag')}
          </label>
          <input
            id="flag"
            name="flag"
            type="text"
            value={formData.flag}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="🇨🇳"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('admin.flagExample')}
          </p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary/50"
            />
            <span className="ml-2 text-sm">{t('admin.defaultLanguage')}</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="content">
          {t('admin.languageFile')} {!language?.content && <span className="text-red-500">*</span>}
        </label>
        <div className="border border-dashed border-border rounded-md p-4 text-center">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            id="language-file"
          />
          <label
            htmlFor="language-file"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <UploadIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {fileName ? fileName : language?.content ? t('admin.replaceFile') : t('admin.selectJsonFile')}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t('admin.jsonRequired')}
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? <LoadingSpinner className="h-4 w-4" /> : null}
          {language?.id ? t('admin.update') : t('admin.add')}
        </button>
      </div>
    </form>
  );
}

function UploadIcon(props) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function LoadingSpinner(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${props.className || ""}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
} 