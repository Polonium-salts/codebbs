import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取用户消息列表
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
    const type = searchParams.get('type') || 'all'; // all, private, system
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    // 构建查询条件
    const whereCondition = {
      receiverId: session.user.id,
    };
    
    // 根据类型过滤
    if (type !== 'all') {
      whereCondition.type = type.toUpperCase();
    }
    
    // 是否只查询未读消息
    if (unreadOnly) {
      whereCondition.isRead = false;
    }
    
    // 获取消息列表
    const messages = await prisma.message.findMany({
      where: whereCondition,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 获取未读消息数
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false
      }
    });
    
    return NextResponse.json({
      messages,
      unreadCount
    });
    
  } catch (error) {
    console.error('获取消息列表时出错:', error);
    return NextResponse.json(
      { error: error.message || '获取消息列表时发生错误' },
      { status: 500 }
    );
  }
}

// 发送新消息
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
    const { receiverId, content, type = 'PRIVATE' } = data;
    
    // 系统消息验证
    if (type === 'SYSTEM' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '您没有权限发送系统消息' },
        { status: 403 }
      );
    }
    
    // 验证参数
    if (!receiverId || !content) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 验证接收者是否存在
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });
    
    if (!receiver) {
      return NextResponse.json(
        { error: '接收者不存在' },
        { status: 404 }
      );
    }
    
    // 创建消息
    const message = await prisma.message.create({
      data: {
        content,
        type,
        senderId: type === 'SYSTEM' ? null : session.user.id,
        receiverId
      }
    });
    
    return NextResponse.json({
      message: '消息发送成功',
      data: message
    });
    
  } catch (error) {
    console.error('发送消息时出错:', error);
    return NextResponse.json(
      { error: error.message || '发送消息时发生错误' },
      { status: 500 }
    );
  }
}

// 创建系统消息（管理员专用）
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否为管理员
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '您没有权限发送系统消息' },
        { status: 403 }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    const { content, receiverId, allUsers } = data;
    
    if (!content) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }
    
    // 向所有用户发送系统消息
    if (allUsers) {
      // 获取所有用户
      const users = await prisma.user.findMany({
        select: { id: true }
      });
      
      // 创建系统消息
      await prisma.$transaction(
        users.map(user => 
          prisma.message.create({
            data: {
              content,
              type: 'SYSTEM',
              senderId: null,
              receiverId: user.id
            }
          })
        )
      );
      
      return NextResponse.json({
        message: '系统消息已发送给所有用户',
        recipientCount: users.length
      });
    } 
    // 向特定用户发送系统消息
    else if (receiverId) {
      // 验证接收者是否存在
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId }
      });
      
      if (!receiver) {
        return NextResponse.json(
          { error: '接收者不存在' },
          { status: 404 }
        );
      }
      
      // 创建系统消息
      const message = await prisma.message.create({
        data: {
          content,
          type: 'SYSTEM',
          senderId: null,
          receiverId
        }
      });
      
      return NextResponse.json({
        message: '系统消息已发送',
        data: message
      });
    } else {
      return NextResponse.json(
        { error: '缺少接收者信息' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('发送系统消息时出错:', error);
    return NextResponse.json(
      { error: error.message || '发送系统消息时发生错误' },
      { status: 500 }
    );
  }
} 