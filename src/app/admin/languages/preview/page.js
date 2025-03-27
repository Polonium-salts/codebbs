"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/components/LanguageProvider';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LanguagePreviewPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState(null);

  useEffect(() => {
    if (!code) {
      setError('No language code provided');
      setLoading(false);
      return;
    }

    fetchLanguage();
  }, [code]);

  const fetchLanguage = async () => {
    try {
      const response = await fetch(`/api/languages/${code}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch language');
      }
      const data = await response.json();
      setLanguage(data);
    } catch (err) {
      console.error('Error fetching language:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('admin.backToLanguages')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{language.flag || '🌐'}</span>
          <h2 className="text-xl font-semibold">{language.name}</h2>
          <span className="text-sm text-muted-foreground">({language.code})</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-medium">{t('admin.languageContent')}</h3>
        </div>
        
        <div className="p-4">
          <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
            {JSON.stringify(language.content, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-medium">{t('admin.languageInfo')}</h3>
        </div>
        
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('admin.isDefault')}</span>
            <span className={language.isDefault ? 'text-green-500' : 'text-muted-foreground'}>
              {language.isDefault ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('admin.isSystem')}</span>
            <span className={language.isSystem ? 'text-blue-500' : 'text-muted-foreground'}>
              {language.isSystem ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('admin.lastUpdated')}</span>
            <span>{new Date(language.lastUpdated).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 