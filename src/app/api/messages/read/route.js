import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 标记消息为已读
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
    const { messageId, all = false } = data;
    
    // 全部标记为已读
    if (all) {
      const result = await prisma.message.updateMany({
        where: {
          receiverId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      return NextResponse.json({
        message: '所有消息已标记为已读',
        count: result.count
      });
    } 
    // 标记单条消息为已读
    else if (messageId) {
      // 验证消息是否存在且属于当前用户
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          receiverId: session.user.id
        }
      });
      
      if (!message) {
        return NextResponse.json(
          { error: '消息不存在或无权限操作' },
          { status: 404 }
        );
      }
      
      // 标记为已读
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true }
      });
      
      return NextResponse.json({
        message: '消息已标记为已读'
      });
    } else {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('标记消息为已读时出错:', error);
    return NextResponse.json(
      { error: '标记消息为已读时发生错误' },
      { status: 500 }
    );
  }
} 