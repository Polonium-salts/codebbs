"use client";

import { useState, useEffect } from 'react';
import { Octokit } from '@octokit/core';
import {
  Github,
  Download,
  Loader2,
  RefreshCw,
  ChevronRight,
  FileText,
  Folder,
  Check,
  AlertCircle,
  X,
  Key,
  Save,
  Info
} from 'lucide-react';
import GitHubExplorer from '@/components/GitHubExplorer';

// 状态徽章组件
const StatusBadge = ({ status }) => {
  const classes = {
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    idle: "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  const icons = {
    success: <Check className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    pending: <Loader2 className="h-4 w-4 animate-spin" />,
    idle: <Info className="h-4 w-4" />
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${classes[status]}`}>
      {icons[status]}
      {{
        success: "成功",
        error: "失败",
        pending: "进行中",
        idle: "未同步"
      }[status]}
    </span>
  );
};

// 同步历史记录项
const SyncHistoryItem = ({ date, status, repo, branch, message }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-3 py-4 border-b border-border">
    <div className="md:w-1/4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{new Date(date).toLocaleString()}</span>
      </div>
    </div>
    <div className="md:w-1/4">
      <StatusBadge status={status} />
    </div>
    <div className="md:w-1/4">
      <div className="flex items-center gap-2">
        <Github className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{repo}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{branch}</span>
      </div>
    </div>
    <div className="md:w-1/4 truncate">
      <div className="flex items-center gap-2">
        <GitCommit className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  </div>
);

export default function GitHubSyncPage() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  
  // 新增的状态变量
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // GitHub Token相关状态
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);
  
  // 获取仓库信息
  const fetchRepoInfo = async () => {
    if (!owner || !repo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 使用我们的后端API获取仓库信息
      const response = await fetch(`/api/github/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `获取仓库信息失败: ${response.status}`);
      }
      
      const data = await response.json();
      setRepoInfo(data.repository);
      setBranches(data.branches || []);
      
      // 设置默认分支
      if (data.repository.default_branch) {
        setBranch(data.repository.default_branch);
      }
      
      // 如果获取成功，自动加载根目录内容
      if (data.repository) {
        setMessage('仓库连接成功');
      }
    } catch (err) {
      console.error('获取仓库信息出错:', err);
      setError(err.message || '获取仓库信息失败');
      setRepoInfo(null);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRepoInfo();
  };
  
  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // 处理文件选择
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setFileContent(file.content);
    
    // 添加到选中文件列表
    setSelectedFiles(prev => {
      // 如果已存在，替换它；否则添加
      const exists = prev.some(f => f.path === file.path);
      if (exists) {
        return prev.map(f => f.path === file.path ? file : f);
      } else {
        return [...prev, file];
      }
    });
  };
  
  // 移除选中的文件
  const removeSelectedFile = (path) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== path));
    
    // 如果当前显示的文件被移除，清空内容显示
    if (selectedFile && selectedFile.path === path) {
      setSelectedFile(null);
      setFileContent(null);
    }
  };
  
  // 同步选中的文件
  const syncSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('请先选择要同步的文件');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/github-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: selectedFiles
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '同步文件失败');
      }
      
      const result = await response.json();
      setMessage(result.message || '文件同步成功');
      
      // 清空选中列表
      setSelectedFiles([]);
      setSelectedFile(null);
      setFileContent(null);
    } catch (err) {
      console.error('同步文件出错:', err);
      setError(err.message || '同步文件失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 保存GitHub Token
  const saveGitHubToken = async () => {
    if (!githubToken.trim()) {
      setError('请输入有效的GitHub Token');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          GITHUB_TOKEN: githubToken
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '保存GitHub Token失败');
      }
      
      setMessage('GitHub Token已保存，请刷新页面以应用更改');
      setTokenSaved(true);
      setShowTokenInput(false);
      
      // 3秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error('保存GitHub Token出错:', err);
      setError(err.message || '保存GitHub Token失败');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">GitHub 代码同步</h1>
      
      {/* 错误消息 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </p>
        </div>
      )}
      
      {/* 成功消息 */}
      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-green-600">
          <p className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            {message}
          </p>
        </div>
      )}
      
      {/* GitHub Token配置 */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1 flex items-center">
              GitHub API Token
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="ml-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded"
              >
                {showTokenInput ? '隐藏' : '配置'}
              </button>
            </h3>
            <p className="text-sm text-blue-700">
              配置GitHub API Token可以提高API请求限制，并启用搜索功能。Token将安全地存储在服务器上。
            </p>
            
            {showTokenInput && (
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="输入GitHub个人访问令牌"
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white"
                  />
                  <Key size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-500" />
                </div>
                <button
                  onClick={saveGitHubToken}
                  disabled={loading || !githubToken.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : '保存'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 仓库输入表单 */}
      <div className="bg-card p-6 rounded-xl border border-border/50 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Github className="mr-2" size={20} />
          仓库配置
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">所有者 / 组织</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="例如: username 或 organization"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">仓库名称</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="例如: my-project"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">分支</label>
            {branches.length > 0 ? (
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="例如: main 或 master"
              />
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>加载中...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>连接仓库</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* 仓库浏览器 */}
      {repoInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 文件浏览区域 */}
          <div className="lg:col-span-2">
            <GitHubExplorer
              owner={owner}
              repo={repo}
              branch={branch}
              onFileSelect={handleFileSelect}
              allowEdit={true}
            />
          </div>
          
          {/* 同步面板 */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col">
              <div className="p-3 bg-muted/30 border-b border-border">
                <h3 className="text-sm font-medium">选中的文件</h3>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto">
                {selectedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    请从左侧选择要同步的文件
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedFiles.map(file => (
                      <div 
                        key={file.path}
                        className={`px-2 py-1.5 rounded border border-border/50 flex items-center justify-between ${
                          selectedFile && selectedFile.path === file.path ? 'bg-primary/5 border-primary/30' : ''
                        }`}
                      >
                        <div 
                          className="flex items-center flex-1 cursor-pointer truncate"
                          onClick={() => handleFileSelect(file)}
                        >
                          <FileText size={14} className="mr-2 text-primary" />
                          <span className="truncate">{file.path}</span>
                        </div>
                        <button 
                          onClick={() => removeSelectedFile(file.path)}
                          className="p-1 hover:bg-red-50 hover:text-red-500 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-border">
                <button
                  onClick={syncSelectedFiles}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center"
                  disabled={loading || selectedFiles.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>同步中...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>同步选中的文件 ({selectedFiles.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 文件内容预览 */}
      {selectedFile && (
        <div className="mt-6 border border-border rounded-lg overflow-hidden">
          <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium">{selectedFile.path}</h3>
            <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
          </div>
          
          <div className="p-3">
            {loadingFile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="mr-2 animate-spin" />
                <span>加载文件内容...</span>
              </div>
            ) : (
              <pre className="overflow-auto p-3 bg-muted/30 rounded-md text-sm max-h-80">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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