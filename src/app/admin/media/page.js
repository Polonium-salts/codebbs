"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  File, 
  Upload, 
  Trash, 
  Search, 
  Filter, 
  Copy, 
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  RefreshCw,
  Grid,
  List,
  Info,
  MoreHorizontal
} from 'lucide-react';

// 单个媒体文件组件（卡片视图）
const MediaCard = ({ item, onSelect, onDelete, onCopyUrl }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 复制链接到剪贴板
  const handleCopyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (onCopyUrl) onCopyUrl(item);
  };

  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(item);
  };

  // 文件类型判断
  const isImage = item.type.startsWith('image/');
  
  return (
    <div 
      className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => onSelect(item)}
    >
      <div className="aspect-square relative">
        {isImage ? (
          <img 
            src={item.url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <File size={48} className="text-muted-foreground" />
          </div>
        )}
        
        {/* 悬浮操作按钮 */}
        {isHovering && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <button 
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              onClick={handleCopyUrl}
              title="复制链接"
            >
              {isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
            <button 
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              onClick={handleDelete}
              title="删除文件"
            >
              <Trash size={18} />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          {new Date(item.createdAt).toLocaleDateString()}
          <span className="mx-1">•</span>
          {(item.size / 1024).toFixed(1)} KB
        </p>
      </div>
    </div>
  );
};

// 单个媒体文件组件（列表视图）
const MediaListItem = ({ item, onSelect, onDelete, onCopyUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  // 复制链接到剪贴板
  const handleCopyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (onCopyUrl) onCopyUrl(item);
  };

  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(item);
  };

  // 文件类型判断
  const isImage = item.type.startsWith('image/');
  
  return (
    <div 
      className="flex items-center border-b border-border py-3 px-4 hover:bg-accent/20 transition-all cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="w-10 h-10 flex-shrink-0 mr-4">
        {isImage ? (
          <img 
            src={item.url} 
            alt={item.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md">
            <File size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground flex items-center">
          {new Date(item.createdAt).toLocaleDateString()}
          <span className="mx-1">•</span>
          {(item.size / 1024).toFixed(1)} KB
        </p>
      </div>
      
      <div className="flex items-center ml-4 space-x-2">
        <button 
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          onClick={handleCopyUrl}
          title="复制链接"
        >
          {isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
        </button>
        <button 
          className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
          onClick={handleDelete}
          title="删除文件"
        >
          <Trash size={18} />
        </button>
      </div>
    </div>
  );
};

export default function MediaManager() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sortOrder, setSortOrder] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef(null);

  // 获取媒体文件列表
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/media');
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取媒体文件列表失败');
      }
    } catch (error) {
      console.error('获取媒体文件列表出错:', error);
      setError('获取媒体文件列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchFiles();
  }, []);

  // 触发文件选择器
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件上传
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 创建FormData对象
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // 发送上传请求
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.ok) {
        const result = await response.json();
        fetchFiles(); // 重新获取文件列表
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '上传文件失败');
      }
    } catch (error) {
      console.error('上传文件出错:', error);
      setError(error.message || '上传文件时发生错误');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // 清空文件输入，以便可以再次选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理文件删除点击
  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  // 执行文件删除
  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/media?id=${fileToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setFiles(files.filter(file => file.id !== fileToDelete.id));
        setShowDeleteModal(false);
        
        // 如果正在预览的是被删除的文件，关闭预览
        if (selectedFile && selectedFile.id === fileToDelete.id) {
          setSelectedFile(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除文件失败');
      }
    } catch (error) {
      console.error('删除文件出错:', error);
      setError(error.message || '删除文件时发生错误');
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  // 复制URL成功的回调
  const handleCopySuccess = (file) => {
    // 可以在这里显示一个通知
    console.log(`已复制 ${file.name} 的链接到剪贴板`);
  };

  // 处理文件选择/预览
  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  // 关闭文件预览
  const handleClosePreview = () => {
    setSelectedFile(null);
  };

  // 过滤文件
  const filteredFiles = files.filter(file => {
    // 搜索过滤
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 类型过滤
    let matchesType = true;
    if (fileTypeFilter === 'images') {
      matchesType = file.type.startsWith('image/');
    } else if (fileTypeFilter === 'documents') {
      matchesType = !file.type.startsWith('image/');
    }
    
    return matchesSearch && matchesType;
  });
  
  // 排序文件
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortOrder === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === 'name-desc') {
      return b.name.localeCompare(a.name);
    } else if (sortOrder === 'size-asc') {
      return a.size - b.size;
    } else if (sortOrder === 'size-desc') {
      return b.size - a.size;
    }
    return 0;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">媒体管理</h1>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={handleUploadClick}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 relative"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>上传中 ({uploadProgress}%)</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>上传文件</span>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
          </button>
          
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground'}`}
              title="网格视图"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground'}`}
              title="列表视图"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-card rounded-xl border border-border/50 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <div className="flex items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="搜索文件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
              />
            </div>
          </div>

          {/* 文件类型筛选 */}
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-muted-foreground" />
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="flex-grow px-4 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">所有文件</option>
              <option value="images">图片</option>
              <option value="documents">文档</option>
            </select>
          </div>

          {/* 排序方式 */}
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-muted-foreground" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="flex-grow px-4 py-2 border border-border rounded-md bg-background"
            >
              <option value="newest">最新上传</option>
              <option value="oldest">最早上传</option>
              <option value="name-asc">文件名 (A-Z)</option>
              <option value="name-desc">文件名 (Z-A)</option>
              <option value="size-asc">文件大小 (小-大)</option>
              <option value="size-desc">文件大小 (大-小)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <XCircle size={18} />
            {error}
          </p>
          <button 
            onClick={fetchFiles}
            className="mt-2 flex items-center gap-1 text-sm hover:underline"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      {/* 文件列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>加载中...</span>
        </div>
      ) : sortedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Image size={48} className="mb-4 opacity-20" />
          {searchTerm || fileTypeFilter !== 'all' ? (
            <p>没有找到符合条件的文件</p>
          ) : (
            <>
              <p>暂无上传文件</p>
              <button
                onClick={handleUploadClick}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                <span>上传第一个文件</span>
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedFiles.map((file) => (
            <MediaCard
              key={file.id}
              item={file}
              onSelect={handleSelectFile}
              onDelete={handleDeleteClick}
              onCopyUrl={handleCopySuccess}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          {sortedFiles.map((file) => (
            <MediaListItem
              key={file.id}
              item={file}
              onSelect={handleSelectFile}
              onDelete={handleDeleteClick}
              onCopyUrl={handleCopySuccess}
            />
          ))}
        </div>
      )}

      {/* 文件预览弹窗 */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-medium truncate">{selectedFile.name}</h3>
              <button 
                onClick={handleClosePreview}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {selectedFile.type.startsWith('image/') ? (
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <File size={64} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">此文件类型无法预览</p>
                  <a 
                    href={selectedFile.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <LinkIcon size={14} />
                    <span>下载文件</span>
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">上传时间</p>
                  <p className="text-sm mt-1">
                    {new Date(selectedFile.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">文件大小</p>
                  <p className="text-sm mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">文件类型</p>
                  <p className="text-sm mt-1">{selectedFile.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">文件位置</p>
                  <p className="text-sm mt-1 truncate text-primary hover:underline cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(selectedFile.url);
                  }}>
                    {selectedFile.url}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFile.url);
                    handleCopySuccess(selectedFile);
                  }}
                  className="px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors flex items-center gap-1"
                >
                  <Copy size={14} />
                  <span>复制链接</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(selectedFile)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-1"
                >
                  <Trash size={14} />
                  <span>删除文件</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">确认删除</h3>
            <p className="mb-6">
              您确定要删除文件 <span className="font-semibold">{fileToDelete?.name}</span> 吗？
              此操作不可逆，文件将被永久删除。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash size={16} className="mr-2" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 