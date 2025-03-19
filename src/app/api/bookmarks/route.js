import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取用户收藏的文章
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    
    // 获取用户收藏列表
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: userId
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            views: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            category: true,
            _count: {
              select: {
                comments: true,
                likes: true,
                bookmarks: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 格式化返回数据
    const formattedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      post: {
        ...bookmark.post,
        content: bookmark.post.content.length > 200 
          ? bookmark.post.content.substring(0, 200) + '...' 
          : bookmark.post.content
      }
    }));
    
    return NextResponse.json(formattedBookmarks);
    
  } catch (error) {
    console.error('获取收藏列表时出错:', error);
    return NextResponse.json(
      { error: '获取收藏列表时发生错误' },
      { status: 500 }
    );
  }
}

// 添加或取消收藏
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    const { postId } = data;
    
    if (!postId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 查找现有收藏记录
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    });
    
    // 如果已收藏，则取消收藏；如果未收藏，则添加收藏
    if (existingBookmark) {
      // 取消收藏
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id }
      });
      
      return NextResponse.json({
        message: '取消收藏成功',
        isBookmarked: false
      });
    } else {
      // 添加收藏
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          postId: postId
        }
      });
      
      return NextResponse.json({
        message: '收藏成功',
        isBookmarked: true
      });
    }
    
  } catch (error) {
    console.error('处理收藏操作时出错:', error);
    return NextResponse.json(
      { error: '处理收藏操作时发生错误' },
      { status: 500 }
    );
  }
} 