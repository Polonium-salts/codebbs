import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取网站统计数据
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
    
    // 并行获取各种数据统计
    const [
      userCount,
      postCount,
      commentCount,
      categoryCount,
      likeCount,
      bookmarkCount,
      followCount,
      totalViewsResult,
      recentPosts,
      recentComments,
      recentUsers
    ] = await Promise.all([
      // 用户总数
      prisma.user.count(),
      
      // 文章总数
      prisma.post.count(),
      
      // 评论总数
      prisma.comment.count(),
      
      // 分类总数
      prisma.category.count(),
      
      // 点赞总数
      prisma.like.count(),
      
      // 收藏总数
      prisma.bookmark.count(),
      
      // 关注总数
      prisma.follow.count(),
      
      // 总浏览量
      prisma.post.aggregate({
        _sum: {
          views: true
        }
      }),
      
      // 最近的5篇文章
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { name: true }
          }
        }
      }),
      
      // 最近的5条评论
      prisma.comment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { name: true }
          },
          post: {
            select: { title: true }
          }
        }
      }),
      
      // 最近注册的5个用户
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      })
    ]);
    
    // 总浏览量
    const totalViews = totalViewsResult._sum.views || 0;
    
    // 整合最近活动
    const recentActivities = [
      // 添加最近的文章
      ...recentPosts.map(post => ({
        type: '新文章',
        user: post.author.name,
        content: post.title,
        time: post.createdAt
      })),
      
      // 添加最近的评论
      ...recentComments.map(comment => ({
        type: '新评论',
        user: comment.author.name,
        content: `在《${comment.post.title}》发表评论: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
        time: comment.createdAt
      })),
      
      // 添加最近注册的用户
      ...recentUsers.map(user => ({
        type: '新用户',
        user: user.name,
        content: `${user.email} 加入了社区`,
        time: user.createdAt
      }))
    ]
    // 按时间降序排序
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    // 只取前10个
    .slice(0, 10);
    
    // 返回统计数据
    return NextResponse.json({
      userCount,
      postCount,
      commentCount,
      categoryCount,
      likeCount,
      bookmarkCount,
      followCount,
      totalViews,
      recentActivities
    });
  } catch (error) {
    console.error('获取管理统计数据出错:', error);
    return NextResponse.json(
      { message: '获取统计数据时发生错误' },
      { status: 500 }
    );
  }
} 