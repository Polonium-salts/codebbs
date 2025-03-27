import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import path from 'path';
import { promises as fsPromises } from 'fs';

// 语言文件目录
const LOCALES_DIR = path.join(process.cwd(), 'src/locales');

// 获取单个语言内容
export async function GET(request, { params }) {
  try {
    const { code } = params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Language code is required' },
        { status: 400 }
      );
    }
    
    // 读取语言文件
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    
    try {
      const fileContent = await fsPromises.readFile(filePath, 'utf8');
      const content = JSON.parse(fileContent);
      
      // 读取语言配置信息
      let configPath = path.join(LOCALES_DIR, 'config.json');
      let config = { default: 'en-US', languages: {} };
      
      try {
        const configData = await fsPromises.readFile(configPath, 'utf8');
        config = JSON.parse(configData);
      } catch (error) {
        // 配置文件不存在，使用默认配置
      }
      
      // 获取语言信息
      const stats = await fsPromises.stat(filePath);
      const langInfo = config.languages[code] || {};
      
      return NextResponse.json({
        code,
        name: langInfo.name || code,
        flag: langInfo.flag || null,
        isDefault: config.default === code,
        isSystem: code === 'en-US' || code === 'zh-CN',
        lastUpdated: stats.mtime,
        content
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Not Found', message: `Language ${code} not found` },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching language:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language', message: error.message },
      { status: 500 }
    );
  }
}

// 删除语言
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { code } = params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Language code is required' },
        { status: 400 }
      );
    }
    
    // 检查是否为系统语言，不允许删除
    if (code === 'en-US' || code === 'zh-CN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cannot delete system languages' },
        { status: 403 }
      );
    }
    
    // 读取配置文件
    let configPath = path.join(LOCALES_DIR, 'config.json');
    let config = { default: 'en-US', languages: {} };
    
    try {
      const configData = await fsPromises.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // 配置文件不存在，使用默认配置
    }
    
    // 检查是否为默认语言，如果是则不允许删除
    if (config.default === code) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cannot delete the default language' },
        { status: 403 }
      );
    }
    
    // 删除语言文件
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
      
      // 从配置中删除语言信息
      if (config.languages[code]) {
        delete config.languages[code];
        await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Not Found', message: `Language ${code} not found` },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting language:', error);
    return NextResponse.json(
      { error: 'Failed to delete language', message: error.message },
      { status: 500 }
    );
  }
} 