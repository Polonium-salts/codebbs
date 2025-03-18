"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';

// 动态导入客户端组件
const TabSwitcher = dynamic(() => import('@/components/TabSwitcher'), { ssr: false });
const ReadOnlyGitRepoTab = dynamic(() => import('@/components/ReadOnlyGitRepoTab'), { ssr: false });
const ArticleContentTab = dynamic(() => import('@/components/ArticleContentTab'), { ssr: false });

export default function ArticleTabsWrapper({ post }) {
  // 检查文章是否有Git仓库信息
  const hasGitRepo = post?.gitOwner && post?.gitRepo;
  
  // 标签页配置
  const tabs = [
    {
      label: "文章内容",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    }
  ];
  
  // 如果有Git仓库信息，添加Git仓库标签页
  if (hasGitRepo) {
    tabs.push({
      label: "Git仓库",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      )
    });
  }

  return (
    <TabSwitcher tabs={tabs}>
      <ArticleContentTab post={post} formatDistanceToNow={formatDistanceToNow} />
      {hasGitRepo && <ReadOnlyGitRepoTab postData={post} />}
    </TabSwitcher>
  );
} 