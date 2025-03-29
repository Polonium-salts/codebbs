"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Save, 
  Upload, 
  RefreshCw, 
  Loader2, 
  Globe, 
  Mail, 
  FileText, 
  Image,
  UserCog,
  BookOpen,
  BellRing,
  Shield,
  Sliders,
  Check,
  Github,
  Database,
  Zap,
  Lock,
  ServerCrash,
  AlertCircle,
  X
} from 'lucide-react';

// 设置项组件
const SettingItem = ({ children, title, description }) => (
  <div className="flex flex-col md:flex-row md:items-start gap-4 py-6 border-b border-border">
    <div className="md:w-1/3">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
    <div className="md:w-2/3">
      {children}
    </div>
  </div>
);

// 设置项分组
const SettingGroup = ({ children, icon: Icon, title }) => (
  <div className="bg-card rounded-xl border border-border/50 overflow-hidden mb-8">
    <div className="px-6 py-4 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-primary" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// 开关组件
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      checked ? 'bg-primary' : 'bg-muted'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
  >
    <span
      className={`${
        checked ? 'translate-x-5' : 'translate-x-1'
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </button>
);

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    siteName: '',
    siteDescription: '',
    siteKeywords: '',
    contactEmail: '',
    logoUrl: '',
    faviconUrl: '',
    footerText: '',
    enableRegistration: true,
    allowComments: true,
    moderateComments: false,
    postsPerPage: 10,
    cacheTimeout: 3600,
    emailNotifications: true,
    maintenanceMode: false,
    githubRepo: '',
    githubBranch: 'main',
    enableImageOptimization: true,
    enablePageCaching: true,
    minifyAssets: true,
    compressionLevel: 'high',
    enableCaptcha: false,
    reCaptchaSiteKey: '',
    reCaptchaSecretKey: '',
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    enableTwoFactor: false,
    enableContentSecurity: true,
    enableApiAccess: false,
    apiRateLimit: 60,
    allowCors: false,
    allowedOrigins: '',
    autoBackupEnabled: false,
    backupFrequency: 'daily',
    backupRetentionDays: 7,
    backupTime: '03:00',
    headerTitle: '',
    enableAnnouncement: false,
    announcementText: '',
    announcementBgColor: '#f3f4f6',
    announcementTextColor: '#374151',
    announcementStartDate: '',
    announcementEndDate: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const logoFileRef = useRef(null);
  const faviconFileRef = useRef(null);
  
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings');
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取系统设置失败');
      }
    } catch (error) {
      console.error('获取系统设置出错:', error);
      setError('获取系统设置时发生错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleToggleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUpload = async (e, type) => {
    e.preventDefault();
    const fileRef = type === 'logo' ? logoFileRef : faviconFileRef;
    
    if (!fileRef.current.files || !fileRef.current.files[0]) {
      return;
    }
    
    const file = fileRef.current.files[0];
    
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过2MB');
      return;
    }
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.message || '上传图片失败');
      }
    } catch (error) {
      console.error('上传图片出错:', error);
      setError('上传图片时发生错误');
    } finally {
      setIsUploading(false);
      fileRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '保存系统设置失败');
      }
    } catch (error) {
      console.error('保存系统设置出错:', error);
      setError('保存系统设置时发生错误');
    } finally {
      setIsSaving(false);
    }
  };
  
  const syncFromGithub = async () => {
    if (!formData.githubRepo) {
      setError('请先设置GitHub仓库地址');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncMessage(null);
      setError(null);
      
      const response = await fetch('/api/admin/github-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repo: formData.githubRepo,
          branch: formData.githubBranch || 'main'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSyncMessage(data.message || '同步成功');
        
        setTimeout(() => {
          setSyncMessage(null);
        }, 5000);
      } else {
        setError(data.message || '从GitHub同步代码失败');
      }
    } catch (error) {
      console.error('从GitHub同步代码出错:', error);
      setError('从GitHub同步代码时发生错误');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">系统设置</h1>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-2"
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
            type="submit"
            form="settings-form"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            <span>{isSaving ? '保存中...' : '保存设置'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </p>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-green-600">
          <p className="flex items-center gap-2">
            <Check size={20} />
            系统设置保存成功
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin mr-2" size={32} />
          <span>加载系统设置中...</span>
        </div>
      ) : (
        <form id="settings-form" onSubmit={handleSubmit}>
          <SettingGroup icon={Globe} title="网站基本信息">
            <SettingItem 
              title="网站名称" 
              description="显示在浏览器标签和网站顶部的名称"
            >
              <input
                type="text"
                name="siteName"
                value={formData.siteName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="输入网站名称"
                required
              />
            </SettingItem>
            
            <SettingItem 
              title="网站顶部名称" 
              description="显示在导航栏中的名称，留空则使用网站名称"
            >
              <input
                type="text"
                name="headerTitle"
                value={formData.headerTitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="输入网站顶部名称（可选）"
              />
            </SettingItem>
            
            <SettingItem 
              title="网站描述" 
              description="用于搜索引擎优化的简短描述"
            >
              <textarea
                name="siteDescription"
                value={formData.siteDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background h-24"
                placeholder="输入网站描述"
              />
            </SettingItem>
            
            <SettingItem 
              title="网站关键词" 
              description="用于搜索引擎优化的关键词，用逗号分隔"
            >
              <input
                type="text"
                name="siteKeywords"
                value={formData.siteKeywords}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="关键词1,关键词2,关键词3"
              />
            </SettingItem>
            
            <SettingItem 
              title="联系邮箱" 
              description="网站的联系邮箱地址"
            >
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="example@example.com"
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={AlertCircle} title="网站公告">
            <SettingItem 
              title="启用公告" 
              description="在网站顶部显示一条全局公告"
            >
              <ToggleSwitch 
                checked={formData.enableAnnouncement} 
                onChange={(value) => handleToggleChange('enableAnnouncement', value)}
              />
            </SettingItem>
            
            {formData.enableAnnouncement && (
              <>
                <SettingItem 
                  title="公告内容" 
                  description="网站顶部显示的公告内容，支持简单HTML"
                >
                  <textarea
                    name="announcementText"
                    value={formData.announcementText}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background h-24"
                    placeholder="输入公告内容"
                    required={formData.enableAnnouncement}
                  />
                </SettingItem>
                
                <SettingItem 
                  title="公告外观" 
                  description="设置公告的背景颜色和文字颜色"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-2 items-center">
                        <label htmlFor="announcementBgColor" className="text-sm">背景颜色:</label>
                        <input
                          type="color"
                          id="announcementBgColor"
                          name="announcementBgColor"
                          value={formData.announcementBgColor}
                          onChange={handleInputChange}
                          className="w-10 h-8 rounded border border-border cursor-pointer"
                        />
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <label htmlFor="announcementTextColor" className="text-sm">文字颜色:</label>
                        <input
                          type="color"
                          id="announcementTextColor"
                          name="announcementTextColor"
                          value={formData.announcementTextColor}
                          onChange={handleInputChange}
                          className="w-10 h-8 rounded border border-border cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 rounded-md" style={{
                      backgroundColor: formData.announcementBgColor,
                      color: formData.announcementTextColor
                    }}>
                      <div className="flex justify-between items-center">
                        <div dangerouslySetInnerHTML={{ __html: formData.announcementText || '公告预览区域' }} />
                        <X size={16} />
                      </div>
                    </div>
                  </div>
                </SettingItem>
                
                <SettingItem 
                  title="公告时间范围" 
                  description="设置公告显示的开始和结束时间，留空表示永久显示"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="announcementStartDate" className="text-sm">开始日期:</label>
                        <input
                          type="datetime-local"
                          id="announcementStartDate"
                          name="announcementStartDate"
                          value={formData.announcementStartDate}
                          onChange={handleInputChange}
                          className="px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label htmlFor="announcementEndDate" className="text-sm">结束日期:</label>
                        <input
                          type="datetime-local"
                          id="announcementEndDate"
                          name="announcementEndDate"
                          value={formData.announcementEndDate}
                          onChange={handleInputChange}
                          className="px-3 py-2 border border-border rounded-md bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </SettingItem>
              </>
            )}
          </SettingGroup>
          
          <SettingGroup icon={Image} title="网站外观">
            <SettingItem 
              title="网站Logo" 
              description="显示在网站顶部的Logo图片（建议尺寸200x60像素）"
            >
              <div className="flex flex-col gap-3">
                {formData.logoUrl && (
                  <div className="p-3 border border-border rounded-md bg-muted/20 inline-block">
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo预览" 
                      className="max-h-12" 
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                    className="flex-grow px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="输入Logo URL"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      ref={logoFileRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                    />
                    <button
                      type="button"
                      onClick={() => logoFileRef.current?.click()}
                      disabled={isUploading}
                      className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1"
                    >
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Upload size={16} />
                      )}
                      <span>上传</span>
                    </button>
                  </div>
                </div>
              </div>
            </SettingItem>
            
            <SettingItem 
              title="网站Favicon" 
              description="显示在浏览器标签的小图标（建议尺寸32x32像素）"
            >
              <div className="flex flex-col gap-3">
                {formData.faviconUrl && (
                  <div className="p-3 border border-border rounded-md bg-muted/20 inline-block">
                    <img 
                      src={formData.faviconUrl} 
                      alt="Favicon预览" 
                      className="h-8 w-8" 
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="faviconUrl"
                    value={formData.faviconUrl}
                    onChange={handleInputChange}
                    className="flex-grow px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="输入Favicon URL"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      ref={faviconFileRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'favicon')}
                    />
                    <button
                      type="button"
                      onClick={() => faviconFileRef.current?.click()}
                      disabled={isUploading}
                      className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1"
                    >
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Upload size={16} />
                      )}
                      <span>上传</span>
                    </button>
                  </div>
                </div>
              </div>
            </SettingItem>
            
            <SettingItem 
              title="页脚文本" 
              description="显示在网站底部的文本，支持HTML"
            >
              <textarea
                name="footerText"
                value={formData.footerText}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background h-24"
                placeholder="© 2023 我的网站. 保留所有权利."
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={FileText} title="内容设置">
            <SettingItem 
              title="每页文章数" 
              description="在文章列表页面每页显示的文章数量"
            >
              <input
                type="number"
                name="postsPerPage"
                value={formData.postsPerPage}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                min="1"
                max="50"
                required
              />
            </SettingItem>
            
            <SettingItem 
              title="允许发表评论" 
              description="是否允许用户在文章下方发表评论"
            >
              <ToggleSwitch 
                checked={formData.allowComments} 
                onChange={(value) => handleToggleChange('allowComments', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="评论需要审核" 
              description="新评论需要管理员审核后才能显示"
            >
              <ToggleSwitch 
                checked={formData.moderateComments} 
                onChange={(value) => handleToggleChange('moderateComments', value)}
                disabled={!formData.allowComments}
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={UserCog} title="用户设置">
            <SettingItem 
              title="允许注册" 
              description="是否允许新用户注册账号"
            >
              <ToggleSwitch 
                checked={formData.enableRegistration} 
                onChange={(value) => handleToggleChange('enableRegistration', value)}
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={Sliders} title="系统设置">
            <SettingItem 
              title="缓存时间" 
              description="页面缓存过期时间，单位为秒（0表示不缓存）"
            >
              <input
                type="number"
                name="cacheTimeout"
                value={formData.cacheTimeout}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                min="0"
                required
              />
            </SettingItem>
            
            <SettingItem 
              title="邮件通知" 
              description="是否启用系统邮件通知功能"
            >
              <ToggleSwitch 
                checked={formData.emailNotifications} 
                onChange={(value) => handleToggleChange('emailNotifications', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="维护模式" 
              description="启用维护模式后，只有管理员可以访问网站，其他用户将看到维护页面"
            >
              <ToggleSwitch 
                checked={formData.maintenanceMode} 
                onChange={(value) => handleToggleChange('maintenanceMode', value)}
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={Github} title="GitHub代码同步">
            <SettingItem 
              title="GitHub仓库" 
              description="要同步的GitHub仓库地址，格式为 用户名/仓库名"
            >
              <input
                type="text"
                name="githubRepo"
                value={formData.githubRepo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="例如: username/repo"
              />
            </SettingItem>
            
            <SettingItem 
              title="分支名称" 
              description="要同步的代码分支，默认为main"
            >
              <input
                type="text"
                name="githubBranch"
                value={formData.githubBranch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="main"
              />
            </SettingItem>
            
            <SettingItem 
              title="代码同步" 
              description="从GitHub仓库拉取最新代码更新网站功能，不影响数据库"
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={syncFromGithub}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                  disabled={isSyncing || !formData.githubRepo}
                >
                  {isSyncing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Github size={16} />
                  )}
                  <span>{isSyncing ? '同步中...' : '从GitHub同步代码'}</span>
                </button>
                
                {syncMessage && (
                  <span className="text-green-500 flex items-center gap-1">
                    <Check size={16} />
                    {syncMessage}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                注意：此操作只更新网站功能代码，不会改变数据库内容。请确保代码兼容性。
              </p>
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={Zap} title="性能优化">
            <SettingItem 
              title="图片优化" 
              description="自动优化上传图片的尺寸和压缩，提高页面加载速度"
            >
              <ToggleSwitch 
                checked={formData.enableImageOptimization} 
                onChange={(value) => handleToggleChange('enableImageOptimization', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="页面缓存" 
              description="启用页面级缓存以提高重复访问的加载速度"
            >
              <ToggleSwitch 
                checked={formData.enablePageCaching} 
                onChange={(value) => handleToggleChange('enablePageCaching', value)}
              />
            </SettingItem>

            <SettingItem 
              title="压缩资源" 
              description="压缩CSS、JS等资源以减少加载时间"
            >
              <ToggleSwitch 
                checked={formData.minifyAssets} 
                onChange={(value) => handleToggleChange('minifyAssets', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="压缩级别" 
              description="设置网站资源压缩级别（较高压缩比会增加服务器负载）"
            >
              <select
                name="compressionLevel"
                value={formData.compressionLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                disabled={!formData.minifyAssets}
              >
                <option value="low">低 (更快处理)</option>
                <option value="medium">中 (平衡)</option>
                <option value="high">高 (更小体积)</option>
              </select>
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={Shield} title="安全设置">
            <SettingItem 
              title="验证码保护" 
              description="在登录和注册页面添加reCAPTCHA验证码防止机器人攻击"
            >
              <ToggleSwitch 
                checked={formData.enableCaptcha} 
                onChange={(value) => handleToggleChange('enableCaptcha', value)}
              />
            </SettingItem>
            
            {formData.enableCaptcha && (
              <>
                <SettingItem 
                  title="reCAPTCHA站点密钥" 
                  description="Google reCAPTCHA站点密钥"
                >
                  <input
                    type="text"
                    name="reCaptchaSiteKey"
                    value={formData.reCaptchaSiteKey}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  />
                </SettingItem>
                
                <SettingItem 
                  title="reCAPTCHA密钥" 
                  description="Google reCAPTCHA私钥（保密）"
                >
                  <input
                    type="password"
                    name="reCaptchaSecretKey"
                    value={formData.reCaptchaSecretKey}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  />
                </SettingItem>
              </>
            )}
            
            <SettingItem 
              title="最大登录尝试次数" 
              description="限制用户登录失败次数，超过后将暂时锁定账号"
            >
              <input
                type="number"
                name="maxLoginAttempts"
                value={formData.maxLoginAttempts}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                min="1"
                max="20"
              />
            </SettingItem>
            
            <SettingItem 
              title="密码最小长度" 
              description="设置用户密码的最小长度要求"
            >
              <input
                type="number"
                name="passwordMinLength"
                value={formData.passwordMinLength}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                min="6"
                max="30"
              />
            </SettingItem>
            
            <SettingItem 
              title="双因素认证" 
              description="允许用户启用双因素认证提高账号安全性"
            >
              <ToggleSwitch 
                checked={formData.enableTwoFactor} 
                onChange={(value) => handleToggleChange('enableTwoFactor', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="内容安全策略" 
              description="启用CSP头以防止XSS攻击和其他代码注入"
            >
              <ToggleSwitch 
                checked={formData.enableContentSecurity} 
                onChange={(value) => handleToggleChange('enableContentSecurity', value)}
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={ServerCrash} title="API设置">
            <SettingItem 
              title="启用API访问" 
              description="允许第三方应用通过API接口访问网站数据"
            >
              <ToggleSwitch 
                checked={formData.enableApiAccess} 
                onChange={(value) => handleToggleChange('enableApiAccess', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="API请求限制" 
              description="每分钟每个IP允许的最大API请求数（防止滥用）"
            >
              <input
                type="number"
                name="apiRateLimit"
                value={formData.apiRateLimit}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                min="1"
                max="1000"
                disabled={!formData.enableApiAccess}
              />
            </SettingItem>
            
            <SettingItem 
              title="跨域资源共享" 
              description="允许其他网站的前端应用访问API"
            >
              <ToggleSwitch 
                checked={formData.allowCors} 
                onChange={(value) => handleToggleChange('allowCors', value)}
                disabled={!formData.enableApiAccess}
              />
            </SettingItem>
            
            <SettingItem 
              title="允许的域名" 
              description="允许访问API的域名列表，用逗号分隔（留空表示允许所有）"
            >
              <input
                type="text"
                name="allowedOrigins"
                value={formData.allowedOrigins}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="example.com,api.example.org"
                disabled={!formData.enableApiAccess || !formData.allowCors}
              />
            </SettingItem>
          </SettingGroup>
          
          <SettingGroup icon={Database} title="数据库备份">
            <SettingItem 
              title="自动备份" 
              description="系统将按计划自动备份数据库"
            >
              <ToggleSwitch 
                checked={formData.autoBackupEnabled} 
                onChange={(value) => handleToggleChange('autoBackupEnabled', value)}
              />
            </SettingItem>
            
            <SettingItem 
              title="备份频率" 
              description="设置数据库自动备份的频率"
            >
              <select
                name="backupFrequency"
                value={formData.backupFrequency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                disabled={!formData.autoBackupEnabled}
              >
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </SettingItem>
            
            <SettingItem 
              title="备份时间" 
              description="设置执行自动备份的具体时间（24小时制）"
            >
              <input
                type="time"
                name="backupTime"
                value={formData.backupTime}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                disabled={!formData.autoBackupEnabled}
              />
            </SettingItem>
            
            <SettingItem 
              title="保留时间" 
              description="自动备份保留的天数，超过后将自动删除"
            >
              <input
                type="number"
                name="backupRetentionDays"
                value={formData.backupRetentionDays}
                onChange={handleInputChange}
                className="w-32 px-3 py-2 border border-border rounded-md bg-background"
                min="1"
                max="365"
                disabled={!formData.autoBackupEnabled}
              />
            </SettingItem>
          </SettingGroup>
        </form>
      )}
    </div>
  );
} 