"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Puzzle, 
  RefreshCw, 
  Loader2, 
  Plus,
  DownloadCloud,
  Power,
  PowerOff,
  ExternalLink,
  Settings,
  Github,
  Package,
  Trash2,
  Check, 
  AlertCircle,
  X,
  Upload
} from 'lucide-react';

// 状态标签组件
const StatusBadge = ({ enabled, isLoaded }) => {
  const getStatusInfo = () => {
    if (enabled && isLoaded) {
      return {
        text: "已启用",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200",
        icon: <Power className="h-4 w-4" />
      };
    } else if (enabled && !isLoaded) {
      return {
        text: "启用但未加载",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
        icon: <AlertCircle className="h-4 w-4" />
      };
    } else {
      return {
        text: "已禁用",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
        icon: <PowerOff className="h-4 w-4" />
      };
    }
  };
  
  const { text, bgColor, textColor, borderColor, icon } = getStatusInfo();
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${bgColor} ${textColor} ${borderColor}`}>
      {icon}
      {text}
    </span>
  );
};

// 插件卡片组件
const PluginCard = ({ plugin, onToggleStatus, onDelete, onOpenConfig }) => {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Puzzle size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">{plugin.displayName}</h3>
          <span className="text-xs text-muted-foreground">v{plugin.version}</span>
        </div>
        <StatusBadge enabled={plugin.enabled} isLoaded={plugin.isLoaded} />
      </div>
      
      <div className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {plugin.description || '无描述'}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {plugin.author && (
            <span className="inline-flex items-center text-xs bg-muted/50 px-2 py-1 rounded-md">
              作者: {plugin.author}
            </span>
          )}
          
          {plugin.hooks && Object.keys(plugin.hooks).length > 0 && (
            <span className="inline-flex items-center text-xs bg-muted/50 px-2 py-1 rounded-md">
              {Object.keys(plugin.hooks).length} 个挂载点
            </span>
          )}
        </div>
        
        <div className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onToggleStatus(plugin)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${
                plugin.enabled
                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              {plugin.enabled ? (
                <>
                  <PowerOff size={14} />
                  <span>禁用</span>
                </>
              ) : (
                <>
                  <Power size={14} />
                  <span>启用</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => onOpenConfig(plugin)}
              className="px-3 py-1.5 bg-muted/50 rounded-md text-sm hover:bg-muted flex items-center gap-1"
            >
              <Settings size={14} />
              <span>配置</span>
            </button>
            
            <button
              onClick={() => onDelete(plugin)}
              className="px-3 py-1.5 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 flex items-center gap-1"
            >
              <Trash2 size={14} />
              <span>删除</span>
            </button>
          </div>
          
          <div className="flex gap-2">
            {plugin.homepage && (
              <a
                href={plugin.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 flex items-center gap-1"
              >
                <ExternalLink size={14} />
                <span>主页</span>
              </a>
            )}
            
            {plugin.repository && (
              <a
                href={plugin.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 flex items-center gap-1"
              >
                <Github size={14} />
                <span>仓库</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 新增插件模态框
const AddPluginModal = ({ isOpen, onClose, onAdd }) => {
  const [pluginData, setPluginData] = useState({
    name: '',
    displayName: '',
    description: '',
    version: '1.0.0',
    author: '',
    main: 'index.js'
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPluginData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(pluginData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-background rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 pr-8">创建新插件</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">插件名称 (唯一标识)</label>
              <input
                type="text"
                name="name"
                value={pluginData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="my-plugin"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">显示名称</label>
              <input
                type="text"
                name="displayName"
                value={pluginData.displayName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="我的插件"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                name="description"
                value={pluginData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="插件功能描述..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">版本</label>
                <input
                  type="text"
                  name="version"
                  value={pluginData.version}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="1.0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">作者</label>
                <input
                  type="text"
                  name="author"
                  value={pluginData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="作者名称"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">主入口文件</label>
              <input
                type="text"
                name="main"
                value={pluginData.main}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="index.js"
                required
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              取消
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 安装插件模态框
const InstallPluginModal = ({ isOpen, onClose, onInstall }) => {
  const [source, setSource] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsInstalling(true);
    onInstall(source).finally(() => {
      setIsInstalling(false);
      if (!isInstalling) {
        setSource('');
      }
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-background rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          disabled={isInstalling}
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 pr-8">从外部安装插件</h2>
        
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">插件源</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              placeholder="https://github.com/username/repo 或 npm包名"
              required
              disabled={isInstalling}
            />
            <p className="text-xs text-muted-foreground mt-1">
              支持GitHub仓库地址或npm包名
            </p>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
              disabled={isInstalling}
            >
              取消
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>安装中...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={16} />
                  <span>安装</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 配置插件模态框
const ConfigPluginModal = ({ isOpen, onClose, plugin, onSave }) => {
  const [configData, setConfigData] = useState({
    displayName: '',
    description: '',
    version: '',
    author: '',
    main: '',
    enabled: false,
    config: '',
    hooks: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (plugin) {
      setConfigData({
        displayName: plugin.displayName || '',
        description: plugin.description || '',
        version: plugin.version || '',
        author: plugin.author || '',
        main: plugin.main || '',
        enabled: plugin.enabled || false,
        config: plugin.config ? JSON.stringify(plugin.config, null, 2) : '',
        hooks: plugin.hooks ? JSON.stringify(plugin.hooks, null, 2) : ''
      });
    }
  }, [plugin]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const validateJson = (jsonString) => {
    if (!jsonString) return true;
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    // 验证JSON格式
    if (!validateJson(configData.config)) {
      setError('配置不是有效的JSON格式');
      return;
    }
    
    if (!validateJson(configData.hooks)) {
      setError('钩子不是有效的JSON格式');
      return;
    }
    
    setIsLoading(true);
    
    const updatedPlugin = {
      ...plugin,
      displayName: configData.displayName,
      description: configData.description,
      version: configData.version,
      author: configData.author,
      main: configData.main,
      enabled: configData.enabled,
      config: configData.config ? configData.config : null,
      hooks: configData.hooks ? configData.hooks : null
    };
    
    onSave(updatedPlugin)
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  if (!isOpen || !plugin) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-background rounded-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 pr-8">
          配置插件：{plugin.displayName}
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-600 text-sm">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">显示名称</label>
                <input
                  type="text"
                  name="displayName"
                  value={configData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">主入口文件</label>
                <input
                  type="text"
                  name="main"
                  value={configData.main}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                name="description"
                value={configData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">版本</label>
                <input
                  type="text"
                  name="version"
                  value={configData.version}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">作者</label>
                <input
                  type="text"
                  name="author"
                  value={configData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                checked={configData.enabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary border-border rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm">
                启用插件
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                插件配置 (JSON格式)
              </label>
              <textarea
                name="config"
                value={configData.config}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm"
                rows={5}
                placeholder="{}"
              />
              <p className="text-xs text-muted-foreground mt-1">
                为插件提供的配置参数，JSON对象格式
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                钩子配置 (JSON格式)
              </label>
              <textarea
                name="hooks"
                value={configData.hooks}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm"
                rows={5}
                placeholder='{"hookName": "methodName"}'
              />
              <p className="text-xs text-muted-foreground mt-1">
                钩子名称到插件方法的映射，格式为 {"{"}"钩子名": "方法名"{"}"}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 插件上传模态框
const UploadPluginModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        setError('仅支持上传.zip格式的插件包');
        setFile(null);
      } else {
        setError(null);
        setFile(selectedFile);
      }
    }
  };
  
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('请先选择一个插件包');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await onUpload(formData);
      
      // 重置状态
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError(error.message || '上传插件时发生错误');
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-background rounded-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          disabled={isUploading}
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 pr-8">上传插件包</h2>
        
        <form onSubmit={handleUpload}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-600 text-sm">
              <p className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">选择插件包 (.zip)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              插件包必须包含package.json文件，且name字段定义插件名称
            </p>
          </div>
          
          {file && (
            <div className="mb-4 p-3 bg-muted/30 rounded-md">
              <p className="text-sm flex items-center">
                <Package className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium">{file.name}</span>
                <span className="ml-2 text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </p>
            </div>
          )}
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
              disabled={isUploading}
            >
              取消
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              disabled={isUploading || !file}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>上传中...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>上传</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [configPlugin, setConfigPlugin] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // 获取所有插件
  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/plugins');
      
      if (response.ok) {
        const data = await response.json();
        setPlugins(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取插件列表失败');
      }
    } catch (error) {
      console.error('获取插件列表出错:', error);
      setError('获取插件列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchPlugins();
  }, []);
  
  // 显示消息
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };
  
  // 切换插件状态
  const handleToggleStatus = async (plugin) => {
    try {
      setError(null);
      
      const updatedPlugin = {
        ...plugin,
        enabled: !plugin.enabled
      };
      
      const response = await fetch('/api/admin/plugins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPlugin)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 更新本地状态
        setPlugins(plugins.map(p => 
          p.id === plugin.id ? data.plugin : p
        ));
        
        showMessage(plugin.enabled ? '插件已禁用' : '插件已启用');
      } else {
        const errorData = await response.json();
        setError(errorData.message || '更新插件状态失败');
      }
    } catch (error) {
      console.error('更新插件状态出错:', error);
      setError('更新插件状态时发生错误');
    }
  };
  
  // 删除插件
  const handleDelete = async (plugin) => {
    if (!confirm(`确定要删除插件 ${plugin.displayName} 吗？`)) {
      return;
    }
    
    try {
      setError(null);
      
      const response = await fetch(`/api/admin/plugins?id=${plugin.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 从本地状态移除
        setPlugins(plugins.filter(p => p.id !== plugin.id));
        showMessage('插件已删除');
      } else {
        const errorData = await response.json();
        setError(errorData.message || '删除插件失败');
      }
    } catch (error) {
      console.error('删除插件出错:', error);
      setError('删除插件时发生错误');
    }
  };
  
  // 打开配置模态框
  const handleOpenConfig = (plugin) => {
    setConfigPlugin(plugin);
  };
  
  // 保存插件配置
  const handleSaveConfig = async (updatedPlugin) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/plugins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPlugin)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 更新本地状态
        setPlugins(plugins.map(p => 
          p.id === updatedPlugin.id ? data.plugin : p
        ));
        
        setConfigPlugin(null);
        showMessage('插件配置已保存');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存插件配置失败');
      }
    } catch (error) {
      console.error('保存插件配置出错:', error);
      setError(error.message || '保存插件配置时发生错误');
      throw error;
    }
  };
  
  // 添加新插件
  const handleAddPlugin = async (pluginData) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/plugins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pluginData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 添加到本地状态
        setPlugins([...plugins, data.plugin]);
        
        setIsAddModalOpen(false);
        showMessage('插件创建成功');
      } else {
        const errorData = await response.json();
        setError(errorData.message || '创建插件失败');
      }
    } catch (error) {
      console.error('创建插件出错:', error);
      setError('创建插件时发生错误');
    }
  };
  
  // 安装插件
  const handleInstallPlugin = async (source) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/plugins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 添加到本地状态
        setPlugins([...plugins, data.plugin]);
        
        setIsInstallModalOpen(false);
        showMessage('插件安装成功');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '安装插件失败');
      }
    } catch (error) {
      console.error('安装插件出错:', error);
      setError(error.message || '安装插件时发生错误');
      throw error;
    }
  };
  
  // 处理插件上传
  const handleUploadPlugin = async (formData) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/plugins/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 添加到本地状态
        setPlugins(plugins => {
          const index = plugins.findIndex(p => p.id === data.plugin.id);
          if (index >= 0) {
            // 更新已存在的插件
            return plugins.map(p => 
              p.id === data.plugin.id ? data.plugin : p
            );
          } else {
            // 添加新插件
            return [...plugins, data.plugin];
          }
        });
        
        setIsUploadModalOpen(false);
        showMessage(data.message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '上传插件失败');
      }
    } catch (error) {
      console.error('上传插件出错:', error);
      setError(error.message || '上传插件时发生错误');
      throw error;
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">插件管理</h1>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPlugins}
            className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            <span>刷新</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            <span>上传插件</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <DownloadCloud size={16} />
            <span>安装插件</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            <span>新增插件</span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </p>
        </div>
      )}

      {/* 成功提示 */}
      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-green-600">
          <p className="flex items-center gap-2">
            <Check size={20} />
            {message}
          </p>
        </div>
      )}

      {/* 插件列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin mr-2" size={32} />
          <span>加载插件中...</span>
        </div>
      ) : plugins.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
          <Puzzle size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">暂无插件</h3>
          <p className="text-muted-foreground mb-6">
            创建、上传或安装插件来扩展论坛功能
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span>新增插件</span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              <span>上传插件</span>
            </button>
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <DownloadCloud size={16} />
              <span>安装插件</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {plugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              onOpenConfig={handleOpenConfig}
            />
          ))}
        </div>
      )}
      
      {/* 模态框 */}
      <AddPluginModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPlugin}
      />
      
      <InstallPluginModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={handleInstallPlugin}
      />
      
      <ConfigPluginModal
        isOpen={Boolean(configPlugin)}
        onClose={() => setConfigPlugin(null)}
        plugin={configPlugin}
        onSave={handleSaveConfig}
      />
      
      <UploadPluginModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadPlugin}
      />
    </div>
  );
} 