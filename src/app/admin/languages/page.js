"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/LanguageProvider';
import { Loader2, Plus, Edit, Trash2, Check, AlertCircle, Globe, ArrowLeft, Eye, Pencil } from 'lucide-react';
import Link from 'next/link';
import LanguageForm from '@/components/admin/LanguageForm';
import LanguageEditor from '@/components/admin/LanguageEditor';

export default function AdminLanguagesPage() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, add, edit
  const [showEditor, setShowEditor] = useState(false);
  
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchLanguages();
  }, [session, router]);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/languages');
      if (!response.ok) throw new Error('Failed to fetch languages');
      const data = await response.json();
      setLanguages(data);
    } catch (err) {
      console.error('Error fetching languages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguage = async (languageData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(languageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.addLanguageError'));
      }

      await fetchLanguages();
      setViewMode('list');
    } catch (error) {
      console.error('添加语言错误:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLanguage = (language) => {
    setEditingLanguage(language);
    setViewMode('edit');
  };

  const handleUpdateLanguage = async (updatedLanguage) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLanguage),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.updateLanguageError'));
      }

      await fetchLanguages();
      setViewMode('list');
      setEditingLanguage(null);
    } catch (error) {
      console.error('更新语言错误:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLanguage = async (code) => {
    if (!confirm(t('admin.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/languages/${code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.deleteLanguageError'));
      }

      await fetchLanguages();
    } catch (error) {
      console.error('删除语言错误:', error);
      setError(error.message);
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

  if (viewMode === 'add') {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('admin.backToLanguages')}
          </button>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">{t('admin.addNewLanguage')}</h1>
          <LanguageForm 
            onSubmit={handleAddLanguage}
            isSubmitting={submitting}
          />
        </div>
      </div>
    );
  }

  if (viewMode === 'edit' && editingLanguage) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setViewMode('list');
              setEditingLanguage(null);
            }}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('admin.backToLanguages')}
          </button>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <LanguageEditor 
            language={editingLanguage}
            onSave={handleUpdateLanguage}
            onCancel={() => {
              setViewMode('list');
              setEditingLanguage(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.languages')}</h1>
        <button 
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          onClick={() => setViewMode('add')}
        >
          <Plus className="h-4 w-4" />
          {t('admin.addNewLanguage')}
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-medium">{t('admin.currentLanguages')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">{t('admin.flag')}</th>
                <th className="px-4 py-3 text-left">{t('admin.languageCode')}</th>
                <th className="px-4 py-3 text-left">{t('admin.languageName')}</th>
                <th className="px-4 py-3 text-center">{t('admin.default')}</th>
                <th className="px-4 py-3 text-center">{t('admin.system')}</th>
                <th className="px-4 py-3 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {languages.map((language) => (
                <tr key={language.code} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-lg">{language.flag || '🌐'}</td>
                  <td className="px-4 py-3">{language.code}</td>
                  <td className="px-4 py-3">{language.name}</td>
                  <td className="px-4 py-3 text-center">
                    {language.isDefault ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {language.isSystem ? (
                      <Check className="h-5 w-5 text-blue-500 mx-auto" />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/languages/preview?code=${language.code}`}
                        className="text-primary hover:text-primary/80 p-1"
                        title={t('admin.preview')}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setEditingLanguage(language);
                          setShowEditor(true);
                        }}
                        className="text-primary hover:text-primary/80 p-1"
                        title={t('admin.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!language.isSystem && (
                        <button
                          onClick={() => handleDeleteLanguage(language.code)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title={t('admin.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {languages.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-3 text-center text-muted-foreground">
                    {t('admin.noLanguages')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditor && editingLanguage && (
        <div className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <LanguageEditor
              language={editingLanguage}
              onSave={handleUpdateLanguage}
              onCancel={() => {
                setShowEditor(false);
                setEditingLanguage(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 