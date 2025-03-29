import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { dbOptimizer } from '@/lib/dbOptimizer';

const execAsync = promisify(exec);

// 获取数据库信息
export async function GET(request) {
  try {
    // 检查用户是否已登录且是管理员
    let session;
    try {
      session = await getServerSession(authOptions);
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
    } else if (searchParams.get('performance') === 'true') {
      // 返回性能分析数据
      const performanceData = await dbOptimizer.analyzePerformance();
      return NextResponse.json(performanceData);
    } else if (searchParams.get('indexes') === 'true') {
      // 返回索引分析数据
      const indexData = await dbOptimizer.optimizeIndexes();
      return NextResponse.json(indexData);
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
    
    // 获取数据表记录数 - 使用Promise.all提高性能
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
    const { action, backupId, daysOld } = data;
    
    if (action === 'backup') {
      // 使用优化器创建备份
      const result = await dbOptimizer.createBackup();
      return NextResponse.json(result);
    } else if (action === 'restore' && backupId) {
      // 恢复备份
      const backupDir = path.resolve('./backups');
      const backupFile = `backup-${backupId}.db`;
      const backupPath = path.join(backupDir, backupFile);
      const dbPath = path.resolve('./prisma/dev.db');
      
      if (!fs.existsSync(backupPath)) {
        return NextResponse.json(
          { message: '指定的备份文件不存在' },
          { status: 404 }
        );
      }
      
      try {
        // 在恢复前创建当前数据库的临时备份
        const tempBackupDate = 'pre-restore-' + new Date().toISOString().replace(/[:.]/g, '-');
        const tempBackupPath = path.join(backupDir, `backup-${tempBackupDate}.db`);
        fs.copyFileSync(dbPath, tempBackupPath);
        
        // 断开所有数据库连接
        await prisma.$disconnect();
        
        // 将备份文件复制到数据库位置
        fs.copyFileSync(backupPath, dbPath);
        
        return NextResponse.json({
          success: true,
          message: '备份已成功恢复',
          restoredBackup: backupFile,
          tempBackup: tempBackupPath
        });
      } catch (error) {
        console.error('恢复备份出错:', error);
        return NextResponse.json(
          { message: '恢复备份时发生错误: ' + error.message },
          { status: 500 }
        );
      }
    } else if (action === 'vacuum') {
      // 执行数据库优化
      const result = await dbOptimizer.vacuum();
      return NextResponse.json(result);
    } else if (action === 'cleanup') {
      // 执行数据清理
      const days = daysOld || 90; // 默认清理90天前的数据
      const result = await dbOptimizer.cleanupData(days);
      return NextResponse.json(result);
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
    } else if (action === 'optimize_indexes') {
      // 优化数据库索引
      const result = await dbOptimizer.optimizeIndexes();
      return NextResponse.json(result);
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

// 获取最后一次备份信息
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
          date: stats.birthtime
        };
      })
      .sort((a, b) => b.date - a.date);
    
    return backupFiles.length > 0 ? backupFiles[0] : null;
  } catch (error) {
    console.error('获取最后一次备份信息出错:', error);
    return null;
  }
}

// 获取备份数量
function getBackupsCount() {
  try {
    const backupDir = path.resolve('./backups');
    if (!fs.existsSync(backupDir)) {
      return 0;
    }
    
    return fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .length;
  } catch (error) {
    console.error('获取备份数量出错:', error);
    return 0;
  }
} 