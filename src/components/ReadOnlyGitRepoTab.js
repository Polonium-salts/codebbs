"use client";

import { useState, useEffect } from 'react';
import {
  Github,
  Gitlab,
  FileText,
  Folder,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  AlertCircle
} from 'lucide-react';

// 文件图标组件
const FileIcon = ({ type, name }) => {
  if (type === 'dir') {
    return <Folder className="h-4 w-4 text-blue-500" />;
  }
  
  const ext = name.split('.').pop().toLowerCase();
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'm', 'mm'];
  
  return (
    <FileText className={`h-4 w-4 ${codeExts.includes(ext) ? 'text-green-500' : 'text-gray-500'}`} />
  );
};

// 文件树项组件
const FileTreeItem = ({ item, level = 0, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    if (item.type === 'dir') {
      setIsOpen(!isOpen);
      if (!isOpen && contents.length === 0) {
        setLoading(true);
        try {
          const response = await fetch(`/api/git/contents?platform=${item.platform}&owner=${item.owner}&repo=${item.repo}&path=${item.path}&branch=${item.branch}`);
          if (!response.ok) throw new Error('Failed to fetch contents');
          const data = await response.json();
          setContents(data);
        } catch (error) {
          console.error('Error fetching contents:', error);
        } finally {
          setLoading(false);
        }
      }
    } else {
      onSelect(item);
    }
  };
  
  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent/50 ${
          selectedPath === item.path ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={handleClick}
      >
        {item.type === 'dir' && (
          loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )
        )}
        <FileIcon type={item.type} name={item.name} />
        <span className="text-sm truncate">{item.name}</span>
      </div>
      {isOpen && contents.length > 0 && (
        <div>
          {contents.map((content) => (
            <FileTreeItem
              key={content.path}
              item={{
                ...content,
                platform: item.platform,
                owner: item.owner,
                repo: item.repo,
                branch: item.branch
              }}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ReadOnlyGitRepoTab({ postData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contents, setContents] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 从文章数据中提取Git仓库信息
  const platform = postData?.gitPlatform || 'github';
  const owner = postData?.gitOwner || '';
  const repo = postData?.gitRepo || '';
  const branch = postData?.gitBranch || 'main';
  
  // 检查是否有有效的仓库配置
  const hasValidRepo = !!owner && !!repo;
  
  // 组件加载时获取仓库内容
  useEffect(() => {
    if (hasValidRepo) {
      fetchRepoContents();
    }
  }, [owner, repo, branch]);
  
  // 获取仓库内容
  const fetchRepoContents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/git/contents?platform=${platform}&owner=${owner}&repo=${repo}&branch=${branch}`
      );
      if (!response.ok) {
        throw new Error('获取仓库内容失败');
      }
      
      const data = await response.json();
      setContents(data);
    } catch (err) {
      console.error('获取仓库内容出错:', err);
      setError(err.message || '获取仓库内容失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取文件内容
  const fetchFileContent = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/git/contents?platform=${platform}&owner=${owner}&repo=${repo}&path=${file.path}&branch=${branch}`
      );
      if (!response.ok) {
        throw new Error('获取文件内容失败');
      }
      
      const data = await response.json();
      setFileContent(data.content);
      setSelectedFile(file);
    } catch (err) {
      console.error('获取文件内容出错:', err);
      setError(err.message || '获取文件内容失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 过滤文件列表
  const filteredContents = contents.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 如果没有仓库配置，显示提示信息
  if (!hasValidRepo) {
    return (
      <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-gradient-to-r from-primary/5 to-blue-500/5">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-primary" />
            <h2 className="font-medium">Git仓库代码</h2>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          该帖子未关联Git仓库
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <div className="flex items-center gap-2">
          {platform === 'github' ? (
            <Github className="h-5 w-5 text-primary" />
          ) : (
            <Gitlab className="h-5 w-5 text-primary" />
          )}
          <h2 className="font-medium">Git仓库代码</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {owner}/{repo} ({branch})
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* 加载提示 */}
          {loading && contents.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>加载中...</span>
            </div>
          )}

          {/* 仓库内容 */}
          {contents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 文件树 */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="搜索文件..."
                      className="w-full pl-8 pr-2 py-1 text-sm border border-border rounded-md bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {filteredContents.map((item) => (
                    <FileTreeItem
                      key={item.path}
                      item={{
                        ...item,
                        platform,
                        owner,
                        repo,
                        branch
                      }}
                      onSelect={fetchFileContent}
                      selectedPath={selectedFile?.path}
                    />
                  ))}
                </div>
              </div>

              {/* 文件预览 */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className="p-2 border-b border-border flex items-center">
                  <div className="flex items-center gap-2">
                    <FileIcon type="file" name={selectedFile?.name || ''} />
                    <span className="text-sm font-medium truncate">
                      {selectedFile?.name || '选择文件预览'}
                    </span>
                  </div>
                </div>
                
                <div className="p-2">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : fileContent ? (
                    <pre className="text-sm overflow-auto max-h-[400px] bg-muted/30 p-2 rounded">
                      {fileContent}
                    </pre>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      选择文件查看内容
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 