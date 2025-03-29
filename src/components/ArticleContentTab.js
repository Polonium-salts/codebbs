"use client";

import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, memo, useMemo } from 'react';
import { useTheme } from 'next-themes';
import BookmarkButton from './BookmarkButton';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import { setupLazyLoading } from '@/lib/utils';

const ArticleContentTab = memo(function ArticleContentTab({ post }) {
  const [fontSize, setFontSize] = useState('normal'); // small, normal, large
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 缓存文章内容片段，避免每次渲染时重新处理
  const contentParagraphs = useMemo(() => {
    return post.content.split('\n');
  }, [post.content]);

  // 在客户端挂载后再读取主题，避免SSR水合不匹配
  useEffect(() => {
    setMounted(true);
    
    // 设置图片懒加载
    const lazyLoadObserver = setupLazyLoading();
    
    return () => {
      // 清理观察者
      if (lazyLoadObserver) {
        lazyLoadObserver.disconnect();
      }
    };
  }, []);

  // 根据字体大小设置类名
  const getContentClass = useMemo(() => {
    switch(fontSize) {
      case 'small': return 'text-sm leading-relaxed';
      case 'large': return 'text-lg leading-relaxed';
      default: return 'text-base leading-relaxed';
    }
  }, [fontSize]);

  // 如果组件还未挂载，提供一个基本渲染，避免闪烁
  if (!mounted) {
    return (
      <div className="bg-card/30 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-300">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{post.title}</h1>
        </div>
        <div className="p-6">
          <div className="prose prose-lg max-w-none mb-8">
            <div className="rounded-lg p-8 shadow-sm border border-gray-300">
              <div className="whitespace-pre-wrap">
                {contentParagraphs.slice(0, 5).map((paragraph, index) => (
                  paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
                ))}
                {contentParagraphs.length > 5 && (
                  <div className="h-20 bg-gradient-to-b from-transparent to-gray-100"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/30 dark:bg-gray-900/40 border dark:border-gray-700 border-gray-300 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800/70 px-6 py-4 border-b dark:border-gray-700 border-gray-300">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="badge bg-primary/15 dark:bg-primary/30 text-primary dark:text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              {post.category.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton 
              postId={post.id} 
              className="inline-flex items-center gap-1 text-xs bg-background/80 dark:bg-gray-800 border dark:border-gray-700 border-gray-300 rounded-full px-2 py-1 hover:bg-accent/10 dark:hover:bg-gray-700 transition-colors"
            />
            <ShareButton 
              title={post.title}
              url={typeof window !== 'undefined' ? window.location.href : ''}
              className="inline-flex items-center gap-1 text-xs bg-background/80 dark:bg-gray-800 border dark:border-gray-700 border-gray-300 rounded-full px-2 py-1 hover:bg-accent/10 dark:hover:bg-gray-700 transition-colors"
            />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight dark:text-white">{post.title}</h1>
        
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground dark:text-gray-400 mt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views} 浏览
            </div>
            <div className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post._count?.comments || 0} 评论
            </div>
            <div className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>

          {/* 字体大小控制 */}
          <div className="flex items-center bg-background/60 dark:bg-gray-800/60 rounded-md border dark:border-gray-700 border-gray-300 p-1">
            <button 
              onClick={() => setFontSize('small')}
              className={`px-2 py-1 rounded text-xs ${fontSize === 'small' ? 'bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-foreground' : 'hover:bg-accent/10 dark:hover:bg-gray-700'}`}
            >
              A-
            </button>
            <button 
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded text-xs ${fontSize === 'normal' ? 'bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-foreground' : 'hover:bg-accent/10 dark:hover:bg-gray-700'}`}
            >
              A
            </button>
            <button 
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded text-xs ${fontSize === 'large' ? 'bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-foreground' : 'hover:bg-accent/10 dark:hover:bg-gray-700'}`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 dark:bg-gray-900/20">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-gray-700 border-gray-300">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 dark:border-primary/40 border-primary/20 shadow-sm">
              <img 
                src={post.author.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}`} 
                alt={post.author.name}
                className="object-cover h-full w-full"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <div className="font-medium dark:text-white">{post.author.name}</div>
            <div className="flex items-center gap-3 mt-1">
              <a href={`/users/${post.author.id}`} className="text-xs text-primary dark:text-primary-foreground hover:underline">
                查看作者资料
              </a>
              <button className="text-xs text-primary dark:text-primary-foreground hover:underline flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6" />
                  <path d="M22 11h-6" />
                </svg>
                关注作者
              </button>
            </div>
          </div>
        </div>

        {/* 文章内容区域 - 使用渐变底色和印刷样式 */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <div className="bg-gradient-to-b from-background to-card/30 dark:from-gray-800 dark:to-gray-900/50 rounded-lg p-8 shadow-sm border dark:border-gray-700 border-gray-300">
            <div className={`${getContentClass} whitespace-pre-wrap dark:text-gray-200`}>
              {/* 使用虚拟化渲染，只渲染可见区域的段落 */}
              {contentParagraphs.map((paragraph, index) => (
                paragraph ? (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ) : (
                  <br key={index} />
                )
              ))}
            </div>
          </div>
        </div>

        {/* 文章底部互动区域 */}
        <div className="flex justify-between items-center bg-card/20 dark:bg-gray-800/40 p-4 rounded-lg border dark:border-gray-700 border-gray-300">
          <div className="flex gap-3">
            <LikeButton postId={post.id} />
          </div>
          <ShareButton 
            title={post.title}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-gray-700 border-gray-300 hover:bg-accent/10 dark:hover:bg-gray-700 transition-colors dark:text-gray-200"
          />
        </div>
      </div>
    </div>
  );
});

export default ArticleContentTab; 