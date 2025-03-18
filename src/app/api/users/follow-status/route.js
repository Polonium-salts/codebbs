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
    
    const { searchParams } = new URL(request.url);
    const userIdsParam = searchParams.get('userIds');
    
    if (!userIdsParam) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const userIds = userIdsParam.split(',');
    
    // 获取当前用户关注的所有用户
    const followRecords = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: {
          in: userIds
        }
      },
      select: {
        followingId: true
      }
    });
    
    // 构建用户ID到关注状态的映射
    const followStates = {};
    userIds.forEach(userId => {
      followStates[userId] = followRecords.some(record => record.followingId === userId);
    });
    
    return NextResponse.json({ followStates });
    
  } catch (error) {
    console.error('获取关注状态时出错:', error);
    return NextResponse.json(
      { error: '获取关注状态时发生错误' },
      { status: 500 }
    );
  }
} 