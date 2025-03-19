import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

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
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 查询是否已收藏
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    });
    
    return NextResponse.json({
      isBookmarked: !!bookmark
    });
    
  } catch (error) {
    console.error('获取收藏状态时出错:', error);
    return NextResponse.json(
      { error: '获取收藏状态时发生错误' },
      { status: 500 }
    );
  }
} 