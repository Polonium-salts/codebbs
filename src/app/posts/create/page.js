"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import GitRepoTab from '@/components/GitRepoTab';

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // 文章表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [published, setPublished] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'git'
  const [gitRepoInfo, setGitRepoInfo] = useState(null);
  
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
          published,
          ...(gitRepoInfo && {
            gitPlatform: gitRepoInfo.gitPlatform,
            gitOwner: gitRepoInfo.gitOwner,
            gitRepo: gitRepoInfo.gitRepo,
            gitBranch: gitRepoInfo.gitBranch
          })
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

  // 处理保存Git仓库信息
  const handleSaveRepoInfo = (repoInfo) => {
    setGitRepoInfo(repoInfo);
  };

  // 插入Markdown格式
  const insertMarkdown = (format) => {
    const textarea = document.getElementById('content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let insertion = '';
    
    switch (format) {
      case 'bold':
        insertion = `**${selectedText || '粗体文本'}**`;
        break;
      case 'italic':
        insertion = `*${selectedText || '斜体文本'}*`;
        break;
      case 'heading':
        insertion = `## ${selectedText || '标题'}`;
        break;
      case 'link':
        insertion = `[${selectedText || '链接文本'}](https://example.com)`;
        break;
      case 'image':
        insertion = `![${selectedText || '图片描述'}](https://example.com/image.jpg)`;
        break;
      case 'code':
        insertion = '```\n' + (selectedText || 'console.log("代码示例")') + '\n```';
        break;
      case 'quote':
        insertion = `> ${selectedText || '引用文本'}`;
        break;
      case 'list':
        insertion = `\n- ${selectedText || '列表项目'}`;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + insertion + content.substring(end);
    setContent(newContent);
    
    // 在下一个tick里设置选择范围
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
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
        
        {/* 编辑/预览/Git仓库切换 */}
        <div className="flex rounded-t-lg overflow-hidden border border-border">
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${activeTab === 'editor' && !previewMode ? 'bg-primary text-white' : 'bg-card hover:bg-accent/10'}`}
            onClick={() => {setActiveTab('editor'); setPreviewMode(false);}}
          >
            编辑
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${activeTab === 'editor' && previewMode ? 'bg-primary text-white' : 'bg-card hover:bg-accent/10'}`}
            onClick={() => {setActiveTab('editor'); setPreviewMode(true);}}
          >
            预览
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center text-sm font-medium ${activeTab === 'git' ? 'bg-primary text-white' : 'bg-card hover:bg-accent/10'}`}
            onClick={() => setActiveTab('git')}
          >
            Git仓库
          </button>
        </div>
        
        {/* Markdown工具栏 */}
        {activeTab === 'editor' && !previewMode && (
          <div className="flex flex-wrap items-center gap-1 p-2 bg-card border-x border-t border-border rounded-t-lg">
            <button
              type="button"
              onClick={() => insertMarkdown('bold')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="粗体"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bold"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('italic')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="斜体"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-italic"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('heading')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="标题"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heading"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('link')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="链接"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('image')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="图片"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('code')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="代码块"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('quote')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="引用"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('list')}
              className="p-1.5 hover:bg-accent/10 rounded"
              title="列表"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
            </button>
          </div>
        )}
        
        {/* 内容编辑/预览/Git仓库 */}
        {activeTab === 'editor' ? (
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
        ) : (
          <GitRepoTab onSaveRepoInfo={handleSaveRepoInfo} />
        )}
        
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
        
        {/* Git仓库信息提示 */}
        {gitRepoInfo && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>已关联 Git 仓库: {gitRepoInfo.gitOwner}/{gitRepoInfo.gitRepo} ({gitRepoInfo.gitBranch})</span>
          </div>
        )}
        
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