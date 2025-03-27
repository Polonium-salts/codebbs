"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, Clock, ArrowLeft } from 'lucide-react';

export default function CategoryPage({ params }) {
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryAndPosts = async () => {
      try {
        // 获取分类信息
        const categoryResponse = await fetch(`/api/categories/${params.id}`);
        if (!categoryResponse.ok) {
          throw new Error('获取分类信息失败');
        }
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // 获取分类下的文章
        const postsResponse = await fetch(`/api/categories/${params.id}/posts`);
        if (!postsResponse.ok) {
          throw new Error('获取文章列表失败');
        }
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (err) {
        console.error('获取数据出错:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndPosts();
  }, [params.id]);

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

  if (!category) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-muted-foreground">分类不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Link 
        href="/categories"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回分类列表
      </Link>

      {/* 分类信息 */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{category.name}</h1>
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

      {/* 文章列表 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">文章列表</h2>
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>{post.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                {post.published ? (
                  <span className="text-green-500">已发布</span>
                ) : (
                  <span className="text-yellow-500">草稿</span>
                )}
              </div>
            </div>
          </Link>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">该分类下暂无文章</div>
          </div>
        )}
      </div>
    </div>
  );
} 