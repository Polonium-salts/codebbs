import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取系统设置
export async function GET() {
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
    const settings = await prisma.setting.findMany();
    
    // 将设置转换为对象格式
    const settingsObj = settings.reduce((acc, item) => {
      // 根据值的类型转换
      let value;
      
      try {
        if (item.type === 'number') {
          value = Number(item.value);
        } else if (item.type === 'boolean') {
          value = item.value === 'true';
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
      maintenanceMode: false
    });
    
    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('获取系统设置出错:', error);
    return NextResponse.json(
      { message: '获取系统设置时发生错误' },
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
    
    // 验证必填字段
    if (!data.siteName || !data.siteName.trim()) {
      return NextResponse.json(
        { message: '网站名称不能为空' },
        { status: 400 }
      );
    }
    
    // 遍历设置项并保存
    const settingsToUpdate = Object.entries(data).map(([key, value]) => {
      let type = typeof value;
      let stringValue;
      
      if (type === 'number') {
        stringValue = value.toString();
      } else if (type === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else {
        stringValue = value;
      }
      
      return {
        key,
        value: stringValue,
        type
      };
    });
    
    // 使用事务保存所有设置
    await prisma.$transaction(async (tx) => {
      for (const item of settingsToUpdate) {
        await tx.setting.upsert({
          where: { key: item.key },
          update: { value: item.value, type: item.type },
          create: { key: item.key, value: item.value, type: item.type }
        });
      }
    });
    
    return NextResponse.json({
      message: '系统设置保存成功'
    });
  } catch (error) {
    console.error('保存系统设置出错:', error);
    return NextResponse.json(
      { message: '保存系统设置时发生错误' },
      { status: 500 }
    );
  }
} 