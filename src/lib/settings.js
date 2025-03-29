// 系统设置工具函数
import { cache } from 'react';

// 服务端获取所有系统设置，带缓存
export const getSettings = cache(async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/settings`, {
      next: { revalidate: 60 } // 1分钟缓存
    });
    
    if (!response.ok) {
      console.error('获取系统设置失败:', response.status);
      return getDefaultSettings();
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取系统设置出错:', error);
    return getDefaultSettings();
  }
});

// 客户端获取所有系统设置
export async function fetchSettings() {
  try {
    const response = await fetch('/api/settings');
    
    if (!response.ok) {
      console.error('获取系统设置失败:', response.status);
      return getDefaultSettings();
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取系统设置出错:', error);
    return getDefaultSettings();
  }
}

// 默认设置
export function getDefaultSettings() {
  return {
    siteName: '编程交流社区',
    siteDescription: '',
    siteKeywords: '',
    contactEmail: '',
    logoUrl: '',
    faviconUrl: '',
    footerText: '© 2023 编程交流社区. 保留所有权利.',
    headerTitle: '',
    enableRegistration: true,
    allowComments: true,
    moderateComments: false,
    postsPerPage: 10,
    enableAnnouncement: false,
    announcementText: '',
    announcementBgColor: '#f3f4f6',
    announcementTextColor: '#374151',
    announcementStartDate: '',
    announcementEndDate: ''
  };
} 