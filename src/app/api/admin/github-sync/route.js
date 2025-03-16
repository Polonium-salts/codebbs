import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import prisma from '@/lib/prisma';
import { execSync } from 'child_process';

// 创建临时目录
const createTempDir = async () => {
  const tempDir = path.join(os.tmpdir(), `github-sync-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};

// 执行系统命令
const executeCommand = (command, cwd) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`执行命令错误: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

// 复制文件到目标目录，忽略数据库和环境文件
const copyFiles = async (sourceDir, targetDir) => {
  // 读取目录内容
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  
  // 创建目标目录（如果不存在）
  await fs.mkdir(targetDir, { recursive: true });
  
  // 忽略的文件和目录（不同步数据库和敏感信息）
  const ignoredPaths = [
    '.git',
    'node_modules',
    '.next',
    'prisma/dev.db',
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ];
  
  // 复制文件和目录
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    
    // 跳过忽略的路径
    if (ignoredPaths.includes(entry.name)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      // 递归复制目录
      await copyFiles(sourcePath, targetPath);
    } else {
      // 复制文件
      await fs.copyFile(sourcePath, targetPath);
    }
  }
};

// 添加同步历史记录
const addSyncHistory = async (userId, status, repo, branch, message) => {
  try {
    // 在Setting表中保存同步历史记录
    // 因为没有专门的SyncHistory表，我们使用Setting表来存储
    // 使用 sync_history_${timestamp} 作为key
    const timestamp = Date.now();
    const historyKey = `sync_history_${timestamp}`;
    
    const historyData = {
      userId,
      status,
      repo,
      branch,
      message,
      timestamp
    };
    
    await prisma.setting.create({
      data: {
        key: historyKey,
        value: JSON.stringify(historyData),
        type: 'sync_history'
      }
    });
    
    return historyData;
  } catch (error) {
    console.error('保存同步历史记录失败:', error);
    // 保存历史失败不影响主流程
    return null;
  }
};

// 获取同步历史记录
export async function GET(request) {
  try {
    // 验证用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 此处可以从数据库读取同步历史记录
    // 示例返回最近的同步记录
    const syncHistory = [
      {
        id: '1',
        date: new Date().toISOString(),
        status: 'success',
        repo: 'user/repo',
        branch: 'main',
        message: '同步成功'
      }
    ];
    
    return NextResponse.json(syncHistory);
  } catch (error) {
    console.error('获取同步历史出错:', error);
    return NextResponse.json(
      { message: `获取同步历史失败: ${error.message}` },
      { status: 500 }
    );
  }
}

// 执行GitHub同步
export async function POST(request) {
  try {
    // 验证用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // 处理选定文件同步
    if (data.files && Array.isArray(data.files)) {
      return await syncSelectedFiles(data.files);
    }
    
    // 处理整个仓库同步
    if (data.repo) {
      // 这部分代码处理原有的整个仓库同步功能
      // 验证参数
      const { repo, branch = 'main' } = data;
      
      if (!repo) {
        return NextResponse.json(
          { message: '缺少GitHub仓库参数' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { message: '整个仓库同步功能已被弃用，请使用文件选择同步功能' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: '无效的请求，缺少必要参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('从GitHub同步代码出错:', error);
    return NextResponse.json(
      { message: `从GitHub同步代码失败: ${error.message}` },
      { status: 500 }
    );
  }
}

// 根据选中的文件列表同步代码
async function syncSelectedFiles(files) {
  try {
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: '未选择任何文件' },
        { status: 400 }
      );
    }
    
    // 项目根目录
    const projectRoot = process.cwd();
    
    // 忽略的文件和目录（敏感配置和数据文件）
    const ignoredPatterns = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      'prisma/dev.db',
      '.git',
      'node_modules',
      '.next',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];
    
    // 检查文件是否应被忽略
    const isIgnored = (filePath) => {
      return ignoredPatterns.some(pattern => {
        const fullPattern = path.join(projectRoot, pattern);
        return filePath.startsWith(fullPattern) || filePath === fullPattern;
      });
    };
    
    // 同步文件计数
    let syncedCount = 0;
    let ignoredCount = 0;
    
    // 处理每个文件
    for (const file of files) {
      try {
        const { path: filePath, content } = file;
        
        if (!filePath || !content) {
          console.warn(`跳过文件: 缺少路径或内容`);
          continue;
        }
        
        // 目标文件在项目中的绝对路径
        const targetPath = path.join(projectRoot, filePath);
        
        // 检查是否为忽略的文件
        if (isIgnored(targetPath)) {
          console.warn(`忽略敏感文件: ${filePath}`);
          ignoredCount++;
          continue;
        }
        
        // 创建目录（如果不存在）
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 写入文件内容
        fs.writeFileSync(targetPath, content, 'utf8');
        syncedCount++;
        
        console.log(`已同步文件: ${filePath}`);
      } catch (err) {
        console.error(`同步文件失败: ${file.path}`, err);
      }
    }
    
    // 构建详细的结果消息
    let resultMessage = `成功同步了 ${syncedCount} 个文件`;
    if (ignoredCount > 0) {
      resultMessage += `，${ignoredCount} 个敏感文件被忽略`;
    }
    
    return NextResponse.json({ 
      message: resultMessage,
      syncedCount,
      ignoredCount
    });
  } catch (error) {
    console.error('同步文件出错:', error);
    return NextResponse.json(
      { message: `同步文件失败: ${error.message}` },
      { status: 500 }
    );
  }
} 