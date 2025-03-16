"use client";

import { useState, useEffect } from 'react';
import { File, Folder, ChevronRight, AlertCircle, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';

// 格式化文件大小
function formatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// 文件图标组件
const FileIcon = ({ fileName }) => {
  // 判断文件类型
  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // 代码文件
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md', 'py', 'go', 'rs', 'java', 'php', 'rb', 'c', 'cpp', 'h', 'cs', 'sh'];
    
    if (codeExtensions.includes(extension)) {
      return 'code';
    }
    
    return 'default';
  };
  
  const fileType = getFileType(fileName);
  
  return (
    <div className="flex-shrink-0 mr-2">
      <File 
        size={16} 
        className={fileType === 'code' ? 'text-blue-500' : 'text-gray-500'} 
      />
    </div>
  );
};

// 面包屑导航组件
const BreadcrumbNav = ({ path, onNavigate }) => {
  const segments = path ? path.split('/') : [];
  
  return (
    <div className="flex items-center flex-wrap text-sm mb-3 text-muted-foreground p-2 bg-muted/30 rounded">
      <button 
        onClick={() => onNavigate('')}
        className="hover:text-foreground flex items-center"
      >
        根目录
      </button>
      
      {segments.length > 0 && segments[0] !== '' && (
        <>
          <ChevronRight size={14} className="mx-1" />
          {segments.map((segment, index) => {
            const currentPath = segments.slice(0, index + 1).join('/');
            
            return (
              <div key={currentPath} className="flex items-center">
                <button 
                  onClick={() => onNavigate(currentPath)}
                  className="hover:text-foreground"
                >
                  {segment}
                </button>
                {index < segments.length - 1 && (
                  <ChevronRight size={14} className="mx-1" />
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// 文件树项组件
const FileTreeItem = ({ item, onFileSelect, onFolderOpen }) => {
  return (
    <div 
      className={`
        flex items-center justify-between p-2 
        ${item.type === 'dir' 
          ? 'hover:bg-primary/5 cursor-pointer'
          : 'hover:bg-muted cursor-pointer'
        }
        rounded-md
      `}
      onClick={() => {
        if (item.type === 'dir') {
          onFolderOpen(item.path);
        } else {
          onFileSelect(item);
        }
      }}
    >
      <div className="flex items-center overflow-hidden">
        {item.type === 'dir' ? (
          <Folder size={16} className="mr-2 text-yellow-500" />
        ) : (
          <FileIcon fileName={item.name} />
        )}
        <div className="truncate">
          {item.name}
        </div>
      </div>
      
      {item.type === 'file' && (
        <div className="text-xs text-muted-foreground ml-2">
          {formatFileSize(item.size)}
        </div>
      )}
    </div>
  );
};

export default function GitHubExplorer({ owner, repo, branch, onFileSelect }) {
  const [contents, setContents] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 加载目录内容
  const loadContents = async (path = '') => {
    if (!owner || !repo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/github/files?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}&ref=${encodeURIComponent(branch)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '获取仓库内容失败');
      }
      
      const data = await response.json();
      
      // 按类型和名称排序：目录优先
      const sortedContents = data.contents.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      setContents(sortedContents);
      setCurrentPath(path);
    } catch (err) {
      console.error('加载目录内容出错:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理文件选择
  const handleFileSelect = (file) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };
  
  // 处理文件夹点击
  const handleFolderOpen = (path) => {
    loadContents(path);
  };
  
  // 处理导航
  const handleNavigate = (path) => {
    loadContents(path);
  };
  
  // 返回上级目录
  const goBack = () => {
    if (!currentPath) return;
    
    const segments = currentPath.split('/');
    segments.pop();
    const parentPath = segments.join('/');
    
    loadContents(parentPath);
  };
  
  // 首次加载和仓库/分支变化时刷新
  useEffect(() => {
    if (owner && repo && branch) {
      loadContents();
    }
  }, [owner, repo, branch]);
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center">
          仓库浏览器
          <span className="ml-2 px-2 py-0.5 bg-muted text-xs rounded-full">
            {branch}
          </span>
        </h3>
        
        <div className="flex items-center gap-2">
          {currentPath && (
            <button
              onClick={goBack}
              className="p-1.5 hover:bg-muted rounded-md"
              title="返回上级目录"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          
          <button
            onClick={() => loadContents(currentPath)}
            className="p-1.5 hover:bg-muted rounded-md"
            title="刷新"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-3">
        {/* 面包屑导航 */}
        <BreadcrumbNav path={currentPath} onNavigate={handleNavigate} />
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-600 text-sm my-4">
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span>加载中...</span>
          </div>
        )}
        
        {/* 文件列表 */}
        {!isLoading && !error && (
          <div className="space-y-1 max-h-[500px] overflow-y-auto p-1">
            {contents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                此目录下没有文件
              </div>
            ) : (
              contents.map((item) => (
                <FileTreeItem
                  key={item.path}
                  item={item}
                  onFileSelect={handleFileSelect}
                  onFolderOpen={handleFolderOpen}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 