"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // 文章表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [published, setPublished] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  
  // 加载状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  
  // 预览窗口高度同步
  const [editorHeight, setEditorHeight] = useState('300px');

  // 检查用户是否已登录
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/posts/create');
    }
  }, [status, router]);

  // 获取文章分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          setError('获取分类失败');
        }
      } catch (error) {
        console.error('获取分类出错:', error);
        setError('获取分类时发生错误');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // 处理编辑器高度变化
  const handleEditorResize = (e) => {
    setEditorHeight(`${e.target.scrollHeight}px`);
  };

  // 处理提交创建文章请求
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !content || !categoryId) {
      setError('请填写所有必填项');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          published
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        router.push(`/posts/${data.post.id}`);
      } else {
        const data = await response.json();
        setError(data.message || '发布文章失败');
      }
    } catch (error) {
      console.error('发布文章出错:', error);
      setError('发布文章时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染预览内容的简单Markdown
  const renderMarkdown = (text) => {
    // 处理段落
    let rendered = text.split('\n').map((line, i) => {
      // 处理标题
      if (line.startsWith('# ')) {
        return `<h1 class="text-2xl font-bold my-3">${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2 class="text-xl font-bold my-3">${line.substring(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3 class="text-lg font-bold my-2">${line.substring(4)}</h3>`;
      }
      
      // 处理无序列表
      else if (line.startsWith('- ')) {
        return `<li class="ml-4">${line.substring(2)}</li>`;
      }
      
      // 处理引用
      else if (line.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-gray-500 pl-4 py-2 my-2 italic">${line.substring(2)}</blockquote>`;
      }
      
      // 处理空行
      else if (line.trim() === '') {
        return '<br />';
      }
      
      // 普通段落
      else {
        return `<p class="my-2">${line}</p>`;
      }
    }).join('');
    
    // 处理粗体
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理链接
    rendered = rendered.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 hover:underline">$1</a>');
    
    // 处理图片
    rendered = rendered.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full my-2" />');
    
    // 处理代码块
    rendered = rendered.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md my-4 overflow-x-auto"><code>$1</code></pre>');
    
    // 处理内联代码
    rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>');
    
    return rendered;
  };

  // 如果正在检查会话状态或未登录，显示加载中
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 如果已登录，显示文章编辑表单
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">创建新文章</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 标题输入 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            文章标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            placeholder="请输入文章标题..."
            required
          />
        </div>
        
        {/* 分类选择 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            选择分类 <span className="text-red-500">*</span>
          </label>
          {isLoadingCategories ? (
            <div className="flex items-center space-x-2 h-10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">加载分类中...</span>
            </div>
          ) : (
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
              required
            >
              <option value="">请选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* 编辑/预览切换 */}
        <div className="flex rounded-t-lg overflow-hidden border border-border">
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${!previewMode ? 'bg-primary text-white' : 'bg-card hover:bg-accent/10'}`}
            onClick={() => setPreviewMode(false)}
          >
            编辑
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${previewMode ? 'bg-primary text-white' : 'bg-card hover:bg-accent/10'}`}
            onClick={() => setPreviewMode(true)}
          >
            预览
          </button>
        </div>
        
        {/* 内容编辑/预览 */}
        <div className={previewMode ? "" : "relative"}>
          {previewMode ? (
            <div 
              className="w-full min-h-[300px] p-4 border border-border rounded-b-lg bg-card/30"
              style={{ minHeight: editorHeight }}
            >
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          ) : (
            <textarea
              id="content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                handleEditorResize(e);
              }}
              onInput={handleEditorResize}
              className="w-full p-4 border border-border rounded-b-lg resize-y min-h-[300px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="在这里使用Markdown格式编写您的文章内容..."
              required
            />
          )}
        </div>
        
        {/* 发布选项 */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="published" className="text-sm">
            立即发布（取消勾选将保存为草稿）
          </label>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                发布中...
              </span>
            ) : (
              published ? '发布文章' : '保存草稿'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 