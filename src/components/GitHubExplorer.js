"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  File, 
  Folder, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  ArrowLeft, 
  Search,
  Edit,
  Save,
  X,
  Check,
  Lock
} from 'lucide-react';

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

// 搜索结果项组件
const SearchResultItem = ({ item, onFileSelect }) => {
  return (
    <div 
      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer rounded-md"
      onClick={() => onFileSelect(item)}
    >
      <div className="flex items-center overflow-hidden">
        <FileIcon fileName={item.name} />
        <div className="truncate">
          {item.path}
        </div>
      </div>
    </div>
  );
};

export default function GitHubExplorer({ owner, repo, branch, onFileSelect, allowEdit = false }) {
  const [contents, setContents] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 编辑相关状态
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);
  const editorRef = useRef(null);
  
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
      setHasToken(data.hasToken);
      
      // 按类型和名称排序：目录优先
      const sortedContents = data.contents.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      setContents(sortedContents);
      setCurrentPath(path);
      
      // 清除搜索状态
      setShowSearchResults(false);
    } catch (err) {
      console.error('加载目录内容出错:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理文件选择
  const handleFileSelect = async (file) => {
    // 清除编辑状态
    setIsEditing(false);
    setEditedContent('');
    
    // 如果是搜索结果，需要先获取文件内容
    if (!file.content) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/github/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            owner,
            repo,
            path: file.path,
            ref: branch
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '获取文件内容失败');
        }
        
        const data = await response.json();
        file = { ...file, content: data.content, size: data.size, sha: data.sha };
      } catch (err) {
        console.error('获取文件内容出错:', err);
        setError(err.message);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    setSelectedFileInfo(file);
    setSelectedFileContent(file.content);
    
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
  
  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim() || !owner || !repo) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch('/api/github/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner,
          repo,
          query: searchQuery,
          ref: branch
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '搜索文件失败');
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowSearchResults(true);
      setHasToken(data.hasToken);
    } catch (err) {
      console.error('搜索文件出错:', err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };
  
  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };
  
  // 处理编辑模式切换
  const toggleEditMode = () => {
    if (isEditing) {
      // 退出编辑模式
      setIsEditing(false);
    } else {
      // 进入编辑模式
      setEditedContent(selectedFileContent);
      setIsEditing(true);
      
      // 聚焦编辑器
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 100);
    }
  };
  
  // 保存编辑内容
  const saveEditedContent = () => {
    if (!selectedFileInfo) return;
    
    // 更新选中的文件内容
    const updatedFile = {
      ...selectedFileInfo,
      content: editedContent
    };
    
    setSelectedFileContent(editedContent);
    setIsEditing(false);
    
    if (onFileSelect) {
      onFileSelect(updatedFile);
    }
  };
  
  // 首次加载和仓库/分支变化时刷新
  useEffect(() => {
    if (owner && repo && branch) {
      loadContents();
    }
  }, [owner, repo, branch]);
  
  // 处理搜索快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F 或 Cmd+F 触发搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !isEditing) {
        e.preventDefault();
        document.getElementById('github-search-input')?.focus();
      }
      
      // Esc 键清除搜索
      if (e.key === 'Escape' && showSearchResults) {
        clearSearch();
      }
      
      // Enter 键执行搜索
      if (e.key === 'Enter' && document.activeElement.id === 'github-search-input') {
        handleSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults, isEditing, searchQuery]);
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center">
          仓库浏览器
          <span className="ml-2 px-2 py-0.5 bg-muted text-xs rounded-full">
            {branch}
          </span>
          {!hasToken && (
            <span className="ml-2 flex items-center text-xs text-amber-600">
              <Lock size={12} className="mr-1" />
              未配置Token
            </span>
          )}
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
        {/* 搜索框 */}
        <div className="mb-3 flex items-center">
          <div className="relative flex-1">
            <input
              id="github-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件... (Ctrl+F)"
              className="w-full pl-8 pr-10 py-1.5 text-sm border border-border rounded-md bg-background"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="ml-2 px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : '搜索'}
          </button>
        </div>
        
        {/* 面包屑导航 - 仅在非搜索模式下显示 */}
        {!showSearchResults && (
          <BreadcrumbNav path={currentPath} onNavigate={handleNavigate} />
        )}
        
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
        
        {/* 搜索结果 */}
        {showSearchResults && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">搜索结果 ({searchResults.length})</h4>
              <button
                onClick={clearSearch}
                className="text-xs text-primary hover:underline"
              >
                返回文件浏览
              </button>
            </div>
            
            <div className="space-y-1 max-h-[500px] overflow-y-auto p-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  未找到匹配的文件
                </div>
              ) : (
                searchResults.map((item) => (
                  <SearchResultItem
                    key={item.path}
                    item={item}
                    onFileSelect={handleFileSelect}
                  />
                ))
              )}
            </div>
          </div>
        )}
        
        {/* 文件列表 - 仅在非搜索模式下显示 */}
        {!showSearchResults && !isLoading && !error && (
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
        
        {/* 文件内容预览/编辑 */}
        {selectedFileInfo && selectedFileContent && (
          <div className="mt-4 border border-border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium truncate flex-1">
                {selectedFileInfo.path}
              </h3>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFileInfo.size)}
                </span>
                
                {allowEdit && (
                  isEditing ? (
                    <>
                      <button
                        onClick={saveEditedContent}
                        className="p-1.5 hover:bg-green-100 text-green-600 rounded-md"
                        title="保存"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-md"
                        title="取消"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleEditMode}
                      className="p-1.5 hover:bg-muted rounded-md"
                      title="编辑"
                    >
                      <Edit size={14} />
                    </button>
                  )
                )}
              </div>
            </div>
            
            <div className="p-3">
              {isEditing ? (
                <textarea
                  ref={editorRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-80 p-3 bg-muted/30 rounded-md text-sm font-mono resize-none border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <pre className="overflow-auto p-3 bg-muted/30 rounded-md text-sm max-h-80 font-mono">
                  {selectedFileContent}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 