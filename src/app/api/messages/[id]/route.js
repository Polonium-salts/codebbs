import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取与特定用户的消息记录
export async function GET(request, { params }) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log('Session:', session);
    } catch (sessionError) {
      console.error('获取会话出错:', sessionError);
      return NextResponse.json(
        { error: '获取会话信息失败' },
        { status: 500 }
      );
    }
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    const userId = params.id;
    
    // 获取发送者信息
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true
      }
    });
    
    if (!sender) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 获取消息列表
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: session.user.id
          },
          {
            senderId: session.user.id,
            receiverId: userId
          }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return NextResponse.json({
      messages,
      sender
    });
    
  } catch (error) {
    console.error('获取消息记录时出错:', error);
    return NextResponse.json(
      { error: error.message || '获取消息记录时发生错误' },
      { status: 500 }
    );
  }
} 