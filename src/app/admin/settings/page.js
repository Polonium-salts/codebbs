"use client";

import { useState, useEffect } from 'react';
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
  Check
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
    maintenanceMode: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 获取系统设置
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
  
  // 初始加载
  useEffect(() => {
    fetchSettings();
  }, []);
  
  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // 处理开关变化
  const handleToggleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 保存设置
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
        
        // 3秒后隐藏成功消息
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

      {/* 错误提示 */}
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

      {/* 保存成功提示 */}
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
          {/* 网站基本信息 */}
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
          
          {/* 网站外观 */}
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
                  <button
                    type="button"
                    className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1"
                  >
                    <Upload size={16} />
                    <span>上传</span>
                  </button>
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
                  <button
                    type="button"
                    className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1"
                  >
                    <Upload size={16} />
                    <span>上传</span>
                  </button>
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
          
          {/* 内容设置 */}
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
          
          {/* 用户设置 */}
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
          
          {/* 系统设置 */}
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
        </form>
      )}
    </div>
  );
} 