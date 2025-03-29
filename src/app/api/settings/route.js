import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取公开的系统设置
export async function GET(request) {
  try {
    // 获取所有系统设置
    const settings = await prisma.setting.findMany({
      where: {
        type: 'system'
      }
    });
    
    // 将设置转换为对象格式
    const settingsObj = settings.reduce((acc, item) => {
      // 根据值的类型转换
      let value;
      
      try {
        if (item.key.includes('enable') || item.key.includes('allow') || item.key === 'maintenanceMode' || item.key === 'moderateComments' || item.key === 'autoBackupEnabled' || item.key === 'minifyAssets') {
          value = item.value === 'true';
        } else if (item.key === 'postsPerPage' || item.key === 'cacheTimeout' || item.key === 'maxLoginAttempts' || item.key === 'passwordMinLength' || item.key === 'apiRateLimit' || item.key === 'backupRetentionDays') {
          value = Number(item.value);
        } else {
          value = item.value;
        }
      } catch (error) {
        console.error(`转换设置项 ${item.key} 失败:`, error);
        value = item.value;
      }
      
      return { ...acc, [item.key]: value };
    }, {
      // 默认设置值
      siteName: '编程交流社区',
      siteDescription: '',
      siteKeywords: '',
      contactEmail: '',
      logoUrl: '',
      faviconUrl: '',
      footerText: '© 2023 编程交流社区. 保留所有权利.',
      enableRegistration: true,
      allowComments: true,
      moderateComments: false,
      postsPerPage: 10,
      headerTitle: '',
      enableAnnouncement: false,
      announcementText: '',
      announcementBgColor: '#f3f4f6',
      announcementTextColor: '#374151',
      announcementStartDate: '',
      announcementEndDate: ''
    });
    
    // 移除敏感设置
    const sensitiveKeys = ['reCaptchaSecretKey', 'GITHUB_TOKEN'];
    sensitiveKeys.forEach(key => {
      if (settingsObj[key]) {
        delete settingsObj[key];
      }
    });
    
    // 检查公告是否在有效期内
    if (settingsObj.enableAnnouncement) {
      const now = new Date();
      
      if (settingsObj.announcementStartDate && new Date(settingsObj.announcementStartDate) > now) {
        settingsObj.enableAnnouncement = false; // 公告尚未开始
      }
      
      if (settingsObj.announcementEndDate && new Date(settingsObj.announcementEndDate) < now) {
        settingsObj.enableAnnouncement = false; // 公告已结束
      }
    }
    
    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('获取系统设置出错:', error);
    return NextResponse.json(
      { 
        siteName: '编程交流社区',
        footerText: '© 2023 编程交流社区. 保留所有权利.',
        error: '获取系统设置失败'
      },
      { status: 500 }
    );
  }
} 