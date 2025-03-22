const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function analyzeDatabase() {
  try {
    console.log('正在分析数据库...\n');
    
    // 获取数据库文件路径和大小
    const dbPath = path.resolve('./prisma/dev.db');
    let dbSize = 0;
    
    try {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
      console.log(`数据库文件: ${dbPath}`);
      console.log(`数据库大小: ${formatFileSize(dbSize)}\n`);
    } catch (err) {
      console.error('获取数据库文件信息失败:', err);
    }
    
    // 获取各数据表的记录数量
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
    
    console.log('数据表记录统计:');
    console.log('----------------');
    console.log(`用户表 (User): ${userCount} 条记录`);
    console.log(`文章表 (Post): ${postCount} 条记录`);
    console.log(`评论表 (Comment): ${commentCount} 条记录`);
    console.log(`分类表 (Category): ${categoryCount} 条记录`);
    console.log(`点赞表 (Like): ${likeCount} 条记录`);
    console.log(`收藏表 (Bookmark): ${bookmarkCount} 条记录`);
    console.log(`关注表 (Follow): ${followCount} 条记录`);
    console.log(`消息表 (Message): ${messageCount} 条记录`);
    console.log('----------------');
    
    // 获取备份信息
    try {
      const backupDir = path.resolve('./backups');
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.endsWith('.db'))
          .map(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            return {
              file,
              size: stats.size,
              createdAt: stats.birthtime
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        
        if (backupFiles.length > 0) {
          console.log('\n备份信息:');
          console.log('----------------');
          console.log(`最近备份: ${backupFiles[0].file}`);
          console.log(`备份时间: ${backupFiles[0].createdAt.toLocaleString()}`);
          console.log(`备份大小: ${formatFileSize(backupFiles[0].size)}`);
          console.log(`备份总数: ${backupFiles.length}`);
          console.log('----------------');
        } else {
          console.log('\n尚无数据库备份');
        }
      } else {
        console.log('\n备份目录不存在');
      }
    } catch (err) {
      console.error('获取备份信息失败:', err);
    }
    
    // 显示运行时间统计
    const latestPost = await prisma.post.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    const firstPost = await prisma.post.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });
    
    const latestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    console.log('\n时间统计:');
    console.log('----------------');
    if (firstPost) {
      console.log(`最早文章: ${firstPost.createdAt.toLocaleString()}`);
    }
    if (latestPost) {
      console.log(`最新文章: ${latestPost.createdAt.toLocaleString()}`);
    }
    if (latestUser) {
      console.log(`最新用户: ${latestUser.createdAt.toLocaleString()}`);
    }
    console.log('----------------');
    
  } catch (error) {
    console.error('分析数据库时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase(); 