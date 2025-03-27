"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { Save, X, AlertTriangle, Copy, CheckCircle2 } from 'lucide-react';

export default function LanguageEditor({ language, onSave, onCancel }) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (language?.content) {
      try {
        // 如果内容是字符串，则解析为JSON对象并格式化
        const formattedJson = JSON.stringify(
          typeof language.content === 'string' 
            ? JSON.parse(language.content) 
            : language.content, 
          null, 
          2
        );
        setContent(formattedJson);
      } catch (err) {
        console.error('无法解析语言内容:', err);
        setContent(typeof language.content === 'string' ? language.content : '{}');
        setError('语言内容格式不正确');
      }
    } else {
      setContent('{}');
    }
  }, [language]);

  const validateJson = (jsonString) => {
    try {
      JSON.parse(jsonString);
      setError(null);
      return true;
    } catch (err) {
      setError(`JSON 格式错误: ${err.message}`);
      return false;
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // 如果内容改变，取消复制状态
    if (copied) setCopied(false);
  };

  const handleSave = () => {
    if (!validateJson(content)) return;
    
    setIsSaving(true);
    try {
      onSave({
        ...language,
        content
      });
    } catch (err) {
      setError(`保存失败: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setError(null);
    } catch (err) {
      setError(`无法格式化 JSON: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">
          {language?.name ? `${t('admin.edit')}: ${language.name} (${language.code})` : t('admin.addNewLanguage')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title={copied ? t('admin.copied') : t('admin.copy')}
          >
            {copied ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={handleFormat}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title={t('admin.format')}
          >
            <FormatIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title={t('admin.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 relative min-h-[300px]">
        <textarea
          value={content}
          onChange={handleContentChange}
          onBlur={() => validateJson(content)}
          className="w-full h-full min-h-[300px] p-4 font-mono text-sm border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none"
          spellCheck={false}
          placeholder="{}"
        />
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <button
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          {t('admin.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!!error || isSaving}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            error || isSaving ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
          } text-white transition-colors`}
        >
          {isSaving ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('admin.save')}
        </button>
      </div>
    </div>
  );
}

function FormatIcon(props) {
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
      <path d="M21 10H3" />
      <path d="M21 6H3" />
      <path d="M21 14H3" />
      <path d="M21 18H3" />
    </svg>
  );
}

function LoadingIcon(props) {
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