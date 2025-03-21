import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 获取请求参数
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 清空当前用户与目标用户之间的所有消息
    // 删除所有当前用户发送给目标用户的消息
    await prisma.message.deleteMany({
      where: {
        senderId: session.user.id,
        receiverId: userId
      }
    });
    
    // 删除所有目标用户发送给当前用户的消息
    await prisma.message.deleteMany({
      where: {
        senderId: userId,
        receiverId: session.user.id
      }
    });
    
    return NextResponse.json({
      message: '聊天记录已清空'
    });
  } catch (error) {
    console.error('清空聊天记录时出错:', error);
    return NextResponse.json(
      { error: '清空聊天记录时发生错误' },
      { status: 500 }
    );
  }
} 