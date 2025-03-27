import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// 语言文件目录
const LOCALES_DIR = path.join(process.cwd(), 'src/locales');

// 确保目录存在
const ensureDirectoryExists = async () => {
  try {
    await fsPromises.access(LOCALES_DIR);
  } catch (error) {
    await fsPromises.mkdir(LOCALES_DIR, { recursive: true });
  }
};

// 获取所有语言
export async function GET() {
  try {
    await ensureDirectoryExists();
    
    // 读取语言目录中的所有JSON文件
    const files = await fsPromises.readdir(LOCALES_DIR);
    const languageFiles = files.filter(file => file.endsWith('.json'));
    
    // 读取语言配置文件（如果存在）
    let languageConfig = {};
    try {
      const configPath = path.join(LOCALES_DIR, 'config.json');
      const configData = await fsPromises.readFile(configPath, 'utf8');
      languageConfig = JSON.parse(configData);
    } catch (error) {
      // 如果配置文件不存在，创建默认配置
      languageConfig = {
        default: 'en-US',
        languages: {}
      };
    }
    
    // 为每个语言文件构建信息
    const languages = await Promise.all(
      languageFiles.map(async (file) => {
        const code = file.replace('.json', '');
        const filePath = path.join(LOCALES_DIR, file);
        const stats = await fsPromises.stat(filePath);
        
        // 从配置中获取语言信息，或使用默认值
        const langInfo = languageConfig.languages[code] || {};
        
        return {
          code,
          name: langInfo.name || code,
          flag: langInfo.flag || null,
          isDefault: languageConfig.default === code,
          isSystem: file === 'en-US.json' || file === 'zh-CN.json', // 系统默认语言
          lastUpdated: stats.mtime
        };
      })
    );
    
    // 按更新时间排序
    languages.sort((a, b) => b.lastUpdated - a.lastUpdated);
    
    return NextResponse.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch languages', message: error.message },
      { status: 500 }
    );
  }
}

// 添加/更新语言
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { code, name, flag, isDefault, content } = data;
    
    // 验证必填字段
    if (!code || !name || !content) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Language code, name and content are required' },
        { status: 400 }
      );
    }
    
    await ensureDirectoryExists();
    
    // 保存语言文件
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    await fsPromises.writeFile(filePath, content);
    
    // 更新语言配置
    let configPath = path.join(LOCALES_DIR, 'config.json');
    let config = { default: 'en-US', languages: {} };
    
    try {
      const configData = await fsPromises.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // 配置文件不存在，使用默认配置
    }
    
    // 更新语言信息
    config.languages[code] = {
      name,
      flag: flag || null
    };
    
    // 如果设置为默认语言，更新默认语言设置
    if (isDefault) {
      config.default = code;
    }
    
    // 保存配置文件
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
    
    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('Error saving language:', error);
    return NextResponse.json(
      { error: 'Failed to save language', message: error.message },
      { status: 500 }
    );
  }
} 