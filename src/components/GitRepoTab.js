"use client";

import { useState } from 'react';

export default function GitRepoTab() {
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [highlightSyntax, setHighlightSyntax] = useState(true);

  const handleFetchRepo = () => {
    // 实现获取仓库功能
    console.log("获取仓库:", repoUrl);
  };

  const handleInsertCode = () => {
    // 实现插入代码功能
    console.log("插入代码:", filePath);
  };

  return (
    <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <h2 className="font-medium">Git仓库代码</h2>
        </div>
        <div className="text-xs text-muted-foreground">在帖子中引用代码</div>
      </div>

      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="repo-url" className="block text-xs font-medium mb-1">仓库URL</label>
            <div className="flex">
              <input
                type="text"
                id="repo-url"
                placeholder="https://github.com/username/repo"
                className="flex-1 px-3 py-2 text-sm rounded-l-md border border-border focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <button 
                className="bg-primary text-primary-foreground rounded-r-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                onClick={handleFetchRepo}
              >
                获取
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="file-path" className="block text-xs font-medium mb-1">文件路径</label>
            <div className="flex">
              <input
                type="text"
                id="file-path"
                placeholder="src/main.js"
                className="flex-1 px-3 py-2 text-sm rounded-l-md border border-border focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
              />
              <button 
                className="bg-accent text-accent-foreground rounded-r-md px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
                onClick={handleInsertCode}
              >
                插入
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input 
                type="checkbox" 
                className="rounded border-border" 
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
              />
              显示行号
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input 
                type="checkbox" 
                className="rounded border-border" 
                checked={highlightSyntax}
                onChange={(e) => setHighlightSyntax(e.target.checked)}
              />
              突出显示语法
            </label>
          </div>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            查看使用帮助
          </button>
        </div>
      </div>
    </div>
  );
} 