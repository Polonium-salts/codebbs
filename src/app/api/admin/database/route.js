import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 获取数据库信息
export async function GET(request) {
  try {
    // 检查用户是否已登录且是管理员
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("用户会话:", session);
    } catch (e) {
      console.error("获取会话出错:", e);
      return NextResponse.json(
        { message: '验证会话失败: ' + e.message },
        { status: 500 }
      );
    }
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log("未授权访问:", session?.user);
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 检查URL查询参数，如果是请求备份列表，则返回所有备份
    const { searchParams } = new URL(request.url);
    if (searchParams.get('backups') === 'true') {
      try {
        const backupDir = path.resolve('./backups');
        if (!fs.existsSync(backupDir)) {
          return NextResponse.json({ backups: [] });
        }
        
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
          .map(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            return {
              id: file.replace(/^backup-/, '').replace(/\.db$/, ''),
              file,
              path: filePath,
              size: stats.size,
              sizeFormatted: formatFileSize(stats.size),
              createdAt: stats.birthtime
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        
        return NextResponse.json({ backups: backupFiles });
      } catch (error) {
        console.error('获取备份列表出错:', error);
        return NextResponse.json(
          { message: '获取备份列表时发生错误' },
          { status: 500 }
        );
      }
    }
    
    // 获取数据库文件路径
    const dbPath = path.resolve('./prisma/dev.db');
    
    // 获取数据库文件大小
    let dbSize = 0;
    try {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
    } catch (err) {
      console.error('获取数据库大小失败:', err);
    }
    
    // 获取数据表记录数
    const [
      userCount,
      postCount,
      commentCount,
      categoryCount,
      likeCount,
      bookmarkCount,
      followCount,
      messageCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.category.count(),
      prisma.like.count(),
      prisma.bookmark.count(),
      prisma.follow.count(),
      prisma.message.count()
    ]);
    
    // 返回数据库信息
    return NextResponse.json({
      dbSize,
      dbSizeFormatted: formatFileSize(dbSize),
      dbPath,
      tables: {
        user: userCount,
        post: postCount,
        comment: commentCount,
        category: categoryCount,
        like: likeCount,
        bookmark: bookmarkCount,
        follow: followCount,
        message: messageCount
      },
      lastBackup: getLastBackupInfo(),
      backupsCount: getBackupsCount()
    });
  } catch (error) {
    console.error('获取数据库信息出错:', error);
    return NextResponse.json(
      { message: '获取数据库信息时发生错误' },
      { status: 500 }
    );
  }
}

// 备份数据库
export async function POST(request) {
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
    const { action, backupId } = data;
    
    if (action === 'backup') {
      // 创建备份目录
      const backupDir = path.resolve('./backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // 生成备份文件名
      const date = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup-${date}.db`);
      
      // 复制数据库文件
      fs.copyFileSync(path.resolve('./prisma/dev.db'), backupPath);
      
      return NextResponse.json({
        success: true,
        message: '数据库备份成功',
        backupPath,
        backupTime: new Date().toISOString()
      });
    } else if (action === 'restore' && backupId) {
      // 验证备份文件存在
      const backupDir = path.resolve('./backups');
      const backupFile = `backup-${backupId}.db`;
      const backupPath = path.join(backupDir, backupFile);
      
      if (!fs.existsSync(backupPath)) {
        return NextResponse.json(
          { message: '指定的备份文件不存在' },
          { status: 404 }
        );
      }
      
      // 断开数据库连接
      await prisma.$disconnect();
      
      try {
        // 备份当前数据库（以防还原失败)
        const currentDbPath = path.resolve('./prisma/dev.db');
        const tempBackupPath = path.join(backupDir, `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
        fs.copyFileSync(currentDbPath, tempBackupPath);
        
        // 复制备份文件到数据库位置
        fs.copyFileSync(backupPath, currentDbPath);
        
        return NextResponse.json({
          success: true,
          message: '数据库已成功从备份还原',
          restoredFrom: backupFile
        });
      } catch (error) {
        console.error('还原数据库出错:', error);
        return NextResponse.json(
          { message: '还原数据库时发生错误: ' + error.message },
          { status: 500 }
        );
      }
    } else if (action === 'vacuum') {
      // 执行SQLite VACUUM操作
      try {
        await prisma.$executeRawUnsafe('VACUUM;');
        return NextResponse.json({
          success: true,
          message: '数据库已成功压缩优化'
        });
      } catch (error) {
        console.error('执行VACUUM出错:', error);
        return NextResponse.json(
          { message: '数据库压缩优化失败' },
          { status: 500 }
        );
      }
    } else if (action === 'delete_backup' && backupId) {
      // 删除指定备份
      const backupDir = path.resolve('./backups');
      const backupFile = `backup-${backupId}.db`;
      const backupPath = path.join(backupDir, backupFile);
      
      if (!fs.existsSync(backupPath)) {
        return NextResponse.json(
          { message: '指定的备份文件不存在' },
          { status: 404 }
        );
      }
      
      try {
        fs.unlinkSync(backupPath);
        return NextResponse.json({
          success: true,
          message: '备份已成功删除',
          deletedBackup: backupFile
        });
      } catch (error) {
        console.error('删除备份出错:', error);
        return NextResponse.json(
          { message: '删除备份时发生错误: ' + error.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: '无效的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('数据库操作出错:', error);
    return NextResponse.json(
      { message: '执行数据库操作时发生错误' },
      { status: 500 }
    );
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取最后备份信息
function getLastBackupInfo() {
  try {
    const backupDir = path.resolve('./backups');
    if (!fs.existsSync(backupDir)) {
      return null;
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          file,
          path: filePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return backupFiles.length > 0 ? backupFiles[0] : null;
  } catch (error) {
    console.error('获取备份信息出错:', error);
    return null;
  }
}

// 获取备份总数
function getBackupsCount() {
  try {
    const backupDir = path.resolve('./backups');
    if (!fs.existsSync(backupDir)) {
      return 0;
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'));
    
    return backupFiles.length;
  } catch (error) {
    console.error('获取备份总数出错:', error);
    return 0;
  }
} 