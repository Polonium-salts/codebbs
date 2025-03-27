"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, Clock } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('获取分类失败');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('获取分类出错:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">文章分类</h1>
        <div className="text-sm text-muted-foreground">
          共 {categories.length} 个分类
        </div>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
          >
            <Link href={`/categories/${category.id}`}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
                    {category.description && (
                      <p className="text-muted-foreground mb-4">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{category._count?.posts || 0} 篇文章</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>最后更新于 {new Date(category.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">暂无分类</div>
        </div>
      )}
    </div>
  );
} 