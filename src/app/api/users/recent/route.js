import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: '请先登录' },
        { status: 401 }
      );
    }
    
    const currentUserId = session.user.id;
    
    // 查找用户最近的聊天对象（已发送消息的用户和已接收消息的用户）
    const sentToUsers = await prisma.message.findMany({
      where: {
        senderId: currentUserId,
        type: 'PRIVATE'
      },
      select: {
        receiver: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    const receivedFromUsers = await prisma.message.findMany({
      where: {
        receiverId: currentUserId,
        type: 'PRIVATE'
      },
      select: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    // 合并并去重
    const userMap = new Map();
    
    sentToUsers.forEach(msg => {
      if (msg.receiver && !userMap.has(msg.receiver.id)) {
        userMap.set(msg.receiver.id, {
          ...msg.receiver,
          lastMessageAt: msg.createdAt
        });
      }
    });
    
    receivedFromUsers.forEach(msg => {
      if (msg.sender) {
        if (!userMap.has(msg.sender.id)) {
          userMap.set(msg.sender.id, {
            ...msg.sender,
            lastMessageAt: msg.createdAt
          });
        } else {
          // 如果已存在，更新为最新的消息时间
          const existing = userMap.get(msg.sender.id);
          if (new Date(msg.createdAt) > new Date(existing.lastMessageAt)) {
            userMap.set(msg.sender.id, {
              ...existing,
              lastMessageAt: msg.createdAt
            });
          }
        }
      }
    });
    
    // 转换回数组并按最近消息时间排序
    const recentUsers = Array.from(userMap.values()).sort((a, b) => 
      new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
    
    return NextResponse.json({
      users: recentUsers.slice(0, 8) // 只返回最近的8个联系人
    });
    
  } catch (error) {
    console.error('获取最近联系人出错:', error);
    return NextResponse.json(
      { message: '获取最近联系人时发生错误' },
      { status: 500 }
    );
  }
} 