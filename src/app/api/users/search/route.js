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
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    if (!query.trim() || query.length < 2) {
      return NextResponse.json({ users: [] });
    }
    
    // 查找匹配的用户，排除当前用户自己
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } }
            ]
          },
          {
            id: { not: session.user.id } // 排除当前用户
          }
        ]
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true
      },
      take: 10
    });
    
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('搜索用户出错:', error);
    return NextResponse.json(
      { message: '搜索用户时发生错误' },
      { status: 500 }
    );
  }
} 