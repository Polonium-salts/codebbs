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
    
    // 处理GitHub Token
    if (data.GITHUB_TOKEN) {
      // 保存到.env文件
      await updateEnvFile('GITHUB_TOKEN', data.GITHUB_TOKEN);
      
      // 同时保存到数据库
      await prisma.setting.upsert({
        where: {
          key_type: {
            key: 'GITHUB_TOKEN',
            type: 'system'
          }
        },
        update: {
          value: '已设置' // 不在数据库中存储实际token，只存储状态
        },
        create: {
          key: 'GITHUB_TOKEN',
          value: '已设置',
          type: 'system'
        }
      });
      
      // 从返回数据中移除token
      delete data.GITHUB_TOKEN;
    }
    
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
          where: {
            key_type: {
              key: item.key,
              type: 'system'
            }
          },
          update: {
            value: item.value,
            type: item.type
          },
          create: {
            key: item.key,
            value: item.value,
            type: item.type
          }
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