"use client";

import { useState, useEffect } from 'react';
import {
  Github,
  Gitlab,
  GitBranch,
  FileText,
  Folder,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  AlertCircle,
  Check
} from 'lucide-react';

// 支持的Git平台
const GIT_PLATFORMS = {
  github: {
    name: 'GitHub',
    icon: Github,
    apiBase: 'https://api.github.com',
    defaultBranch: 'main'
  },
  gitee: {
    name: 'Gitee',
    icon: Gitlab,
    apiBase: 'https://gitee.com/api/v5',
    defaultBranch: 'master'
  },
  gitlab: {
    name: 'GitLab',
    icon: Gitlab,
    apiBase: 'https://gitlab.com/api/v4',
    defaultBranch: 'main'
  },
  gitea: {
    name: 'Gitea',
    icon: Gitlab,
    apiBase: 'https://gitea.com/api/v1',
    defaultBranch: 'main'
  }
};

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

export default function GitRepoTab({ onSaveRepoInfo }) {
  const [platform, setPlatform] = useState('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contents, setContents] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [highlightSyntax, setHighlightSyntax] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [repoSaved, setRepoSaved] = useState(false);
  
  // 解析仓库URL
  const parseRepoUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          repo: pathParts[1]
        };
      }
      throw new Error('Invalid repository URL');
    } catch (error) {
      throw new Error('Invalid repository URL');
    }
  };
  
  // 获取仓库信息
  const fetchRepoInfo = async () => {
    if (!repoUrl) {
      setError('请输入仓库URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setRepoSaved(false);
    
    try {
      const { owner, repo } = parseRepoUrl(repoUrl);
      setOwner(owner);
      setRepo(repo);
      
      // 获取仓库信息和分支列表
      const response = await fetch(`/api/git/repo?platform=${platform}&owner=${owner}&repo=${repo}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '获取仓库信息失败');
      }
      
      const data = await response.json();
      setBranches(data.branches || []);
      setBranch(data.repository.default_branch || GIT_PLATFORMS[platform].defaultBranch);
      
      // 获取根目录内容
      const contentsResponse = await fetch(
        `/api/git/contents?platform=${platform}&owner=${owner}&repo=${repo}&branch=${data.repository.default_branch || GIT_PLATFORMS[platform].defaultBranch}`
      );
      if (!contentsResponse.ok) {
        throw new Error('获取仓库内容失败');
      }
      
      const contentsData = await contentsResponse.json();
      setContents(contentsData);
    } catch (err) {
      console.error('获取仓库信息出错:', err);
      setError(err.message || '获取仓库信息失败');
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
  
  // 插入代码到编辑器
  const insertCode = () => {
    if (!selectedFile || !fileContent) {
      setError('请先选择要插入的文件');
      return;
    }
    
    // 这里需要实现与编辑器的集成
    // 可以通过自定义事件或回调函数将代码插入到编辑器中
    const code = `\`\`\`${selectedFile.name.split('.').pop()}\n${fileContent}\n\`\`\``;
    window.dispatchEvent(new CustomEvent('insertCode', { detail: code }));
  };
  
  // 过滤文件列表
  const filteredContents = contents.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 保存仓库信息到帖子
  const saveRepoInfo = () => {
    if (!owner || !repo) {
      setError('请先获取有效的仓库');
      return;
    }
    
    // 调用父组件传递的保存函数
    if (onSaveRepoInfo) {
      onSaveRepoInfo({
        gitPlatform: platform,
        gitOwner: owner,
        gitRepo: repo,
        gitBranch: branch
      });
      setRepoSaved(true);
      setTimeout(() => setRepoSaved(false), 3000);
    }
  };
  
  return (
    <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5 text-primary" />
          <h2 className="font-medium">Git仓库代码</h2>
        </div>
        <div className="text-xs text-muted-foreground">在帖子中引用代码</div>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {/* 平台选择和仓库URL输入 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium mb-1">Git平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              >
                {Object.entries(GIT_PLATFORMS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">仓库URL</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder={`https://${platform}.com/username/repo`}
                  className="flex-1 px-3 py-2 text-sm rounded-l-md border border-border focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
                <button 
                  className="bg-primary text-primary-foreground rounded-r-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                  onClick={fetchRepoInfo}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '获取'}
                </button>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* 保存成功提示 */}
          {repoSaved && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <Check className="h-4 w-4" />
              Git仓库信息已保存到帖子中
            </div>
          )}

          {/* 仓库内容 */}
          {contents.length > 0 && (
            <>
              {/* 分支选择和保存按钮 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-1 text-muted-foreground" />
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="text-sm border border-border rounded px-2 py-1 bg-background"
                    >
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={saveRepoInfo}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  保存到帖子
                </button>
              </div>
              
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
                  <div className="p-2 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileIcon type="file" name={selectedFile?.name || ''} />
                      <span className="text-sm font-medium truncate">
                        {selectedFile?.name || '选择文件预览'}
                      </span>
                    </div>
                    {selectedFile && (
                      <button
                        onClick={insertCode}
                        className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      >
                        插入代码
                      </button>
                    )}
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
            </>
          )}

          {/* 代码显示选项 */}
          <div className="flex items-center gap-4">
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
        </div>
      </div>
    </div>
  );
} 