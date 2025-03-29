import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// 获取系统设置
export async function GET(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取所有设置项
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
      siteName: '我的网站',
      siteDescription: '',
      siteKeywords: '',
      contactEmail: '',
      logoUrl: '',
      faviconUrl: '',
      footerText: '© 2023 我的网站. 保留所有权利.',
      enableRegistration: true,
      allowComments: true,
      moderateComments: false,
      postsPerPage: 10,
      cacheTimeout: 3600,
      emailNotifications: true,
      maintenanceMode: false,
      githubRepo: '',
      githubBranch: 'main',
      // 新增性能优化设置默认值
      enableImageOptimization: true,
      enablePageCaching: true,
      minifyAssets: true,
      compressionLevel: 'high',
      // 新增安全设置默认值
      enableCaptcha: false,
      reCaptchaSiteKey: '',
      reCaptchaSecretKey: '',
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      enableTwoFactor: false,
      enableContentSecurity: true,
      // 新增API设置默认值
      enableApiAccess: false,
      apiRateLimit: 60,
      allowCors: false,
      allowedOrigins: '',
      // 新增数据库备份设置默认值
      autoBackupEnabled: false,
      backupFrequency: 'daily', 
      backupRetentionDays: 7,
      backupTime: '03:00',
      // 新增网站顶部名称设置
      headerTitle: '',
      // 新增公告设置
      enableAnnouncement: false,
      announcementText: '',
      announcementBgColor: '#f3f4f6',
      announcementTextColor: '#374151',
      announcementStartDate: '',
      announcementEndDate: ''
    });
    
    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('获取系统设置出错:', error);
    return NextResponse.json(
      { message: '获取系统设置时发生错误', error: error.message },
      { status: 500 }
    );
  }
}

// 保存系统设置
export async function PUT(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // 处理安全敏感的密钥
    const sensitiveKeys = ['reCaptchaSecretKey', 'GITHUB_TOKEN'];
    for (const key of sensitiveKeys) {
      if (data[key]) {
        // 保存到.env文件
        await updateEnvFile(key, data[key]);
        
        // 同时保存到数据库，但不保存实际值
        await prisma.setting.upsert({
          where: {
            key_type: {
              key: key,
              type: 'system'
            }
          },
          update: {
            value: '已设置' // 不在数据库中存储实际token，只存储状态
          },
          create: {
            key: key,
            value: '已设置',
            type: 'system'
          }
        });
        
        // 从返回数据中移除敏感信息
        delete data[key];
      }
    }
    
    // 验证必填字段
    if (!data.siteName || !data.siteName.trim()) {
      return NextResponse.json(
        { message: '网站名称不能为空' },
        { status: 400 }
      );
    }
    
    // 验证公告设置
    if (data.enableAnnouncement && !data.announcementText?.trim()) {
      return NextResponse.json(
        { message: '启用公告时，公告内容不能为空' },
        { status: 400 }
      );
    }
    
    // 验证日期格式
    if (data.announcementStartDate && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.announcementStartDate)) {
      return NextResponse.json(
        { message: '公告开始日期格式无效' },
        { status: 400 }
      );
    }
    
    if (data.announcementEndDate && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.announcementEndDate)) {
      return NextResponse.json(
        { message: '公告结束日期格式无效' },
        { status: 400 }
      );
    }
    
    // 验证公告日期逻辑
    if (data.announcementStartDate && data.announcementEndDate) {
      const startDate = new Date(data.announcementStartDate);
      const endDate = new Date(data.announcementEndDate);
      
      if (endDate < startDate) {
        return NextResponse.json(
          { message: '公告结束日期不能早于开始日期' },
          { status: 400 }
        );
      }
    }
    
    // 验证数值字段
    const numberFields = ['postsPerPage', 'cacheTimeout', 'maxLoginAttempts', 'passwordMinLength', 'apiRateLimit', 'backupRetentionDays'];
    for (const field of numberFields) {
      if (data[field] !== undefined) {
        const value = Number(data[field]);
        if (isNaN(value) || value < 0) {
          return NextResponse.json(
            { message: `${field} 必须是有效的数字` },
            { status: 400 }
          );
        }
      }
    }
    
    // 处理特殊设置值
    if (data.allowCors === true && data.enableApiAccess === false) {
      data.allowCors = false; // 如果API未启用，自动禁用CORS
    }
    
    // 处理网站顶部标题
    if (!data.headerTitle) {
      data.headerTitle = ''; // 确保空值为空字符串而非null
    }
    
    // 临时简化数据库操作，避免使用valueType字段
    // 遍历设置项并保存
    for (const [key, value] of Object.entries(data)) {
      let stringValue;
      
      if (typeof value === 'number') {
        stringValue = value.toString();
      } else if (typeof value === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else {
        stringValue = value || ''; // 确保空值为空字符串
      }
      
      // 使用简化的upsert操作
      await prisma.setting.upsert({
        where: {
          key_type: {
            key: key,
            type: 'system'
          }
        },
        update: {
          value: stringValue
        },
        create: {
          key: key,
          value: stringValue,
          type: 'system'
        }
      });
    }
    
    // 根据设置更新系统配置
    await updateSystemConfiguration(data);
    
    return NextResponse.json({
      message: '系统设置保存成功'
    });
  } catch (error) {
    console.error('保存系统设置出错:', error);
    return NextResponse.json(
      { message: '保存系统设置时发生错误', error: error.message },
      { status: 500 }
    );
  }
}

// 更新.env文件
async function updateEnvFile(key, value) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    // 读取现有.env文件
    try {
      envContent = await fs.promises.readFile(envPath, 'utf8');
    } catch (err) {
      // 如果文件不存在，创建空内容
      envContent = '';
    }
    
    // 检查是否已存在该变量
    const regex = new RegExp(`^${key}=.*`, 'm');
    const exists = regex.test(envContent);
    
    if (exists) {
      // 更新现有变量
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // 添加新变量
      envContent += `\n${key}=${value}`;
    }
    
    // 写入文件
    await fs.promises.writeFile(envPath, envContent.trim(), 'utf8');
    
    console.log(`环境变量 ${key} 已更新`);
    return true;
  } catch (error) {
    console.error('更新环境变量出错:', error);
    throw error;
  }
}

// 根据设置更新系统配置
async function updateSystemConfiguration(settings) {
  try {
    // 可以在这里添加代码来根据用户更改的设置动态更新系统配置
    // 例如：更新Next.js配置，更新网站头信息等
    
    // 示例：更新CSP设置（如果启用）
    if (settings.enableContentSecurity) {
      // 在实际应用中实现CSP头设置
      console.log('内容安全策略已启用');
    }
    
    // 示例：设置备份计划
    if (settings.autoBackupEnabled) {
      // 在实际应用中设置定时备份任务
      console.log(`数据库自动备份已设置: ${settings.backupFrequency}，时间: ${settings.backupTime}`);
    }
    
    // 处理网站公告设置
    if (settings.enableAnnouncement) {
      console.log('网站公告已启用，内容:', settings.announcementText.substring(0, 30) + '...');
    }
    
    return true;
  } catch (error) {
    console.error('更新系统配置出错:', error);
    throw error;
  }
} 