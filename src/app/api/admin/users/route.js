import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 每页显示的用户数量
const PAGE_SIZE = 10;

// 获取用户列表
export async function GET(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    
    // 构建查询条件
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : {};
    
    // 获取总记录数
    const totalCount = await prisma.user.count({
      where
    });
    
    // 计算总页数
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    // 获取当前页的用户
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    });
    
    return NextResponse.json({
      users,
      page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error('获取用户列表出错:', error);
    return NextResponse.json(
      { message: '获取用户列表时发生错误' },
      { status: 500 }
    );
  }
}

// 创建或更新用户
export async function PUT(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // 如果没有ID，创建新用户
    if (!data.id) {
      // 创建新用户必须提供密码
      if (!data.password) {
        return NextResponse.json(
          { message: '创建新用户必须提供密码' },
          { status: 400 }
        );
      }
      
      // 检查邮箱是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { message: '邮箱已被使用' },
          { status: 400 }
        );
      }
      
      // 对密码进行哈希处理
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role || 'USER',
          bio: data.bio
        }
      });
      
      return NextResponse.json({
        message: '用户创建成功',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }, { status: 201 });
    } 
    // 更新现有用户
    else {
      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id: data.id }
      });
      
      if (!existingUser) {
        return NextResponse.json(
          { message: '用户不存在' },
          { status: 404 }
        );
      }
      
      // 如果更改了邮箱，检查新邮箱是否被其他用户使用
      if (data.email !== existingUser.email) {
        const emailInUse = await prisma.user.findFirst({
          where: {
            email: data.email,
            id: { not: data.id }
          }
        });
        
        if (emailInUse) {
          return NextResponse.json(
            { message: '邮箱已被其他用户使用' },
            { status: 400 }
          );
        }
      }
      
      // 准备更新数据
      const updateData = {
        name: data.name,
        email: data.email,
        role: data.role,
        bio: data.bio
      };
      
      // 如果提供了新密码，更新密码
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      
      // 更新用户
      const updatedUser = await prisma.user.update({
        where: { id: data.id },
        data: updateData
      });
      
      return NextResponse.json({
        message: '用户更新成功',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    }
  } catch (error) {
    console.error('创建/更新用户出错:', error);
    return NextResponse.json(
      { message: '创建/更新用户时发生错误' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取要删除的用户ID
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { message: '用户ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 不能删除自己
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: '不能删除当前登录的用户' },
        { status: 400 }
      );
    }
    
    // 删除用户相关的所有数据
    await prisma.$transaction([
      // 删除用户的点赞
      prisma.like.deleteMany({
        where: { userId }
      }),
      
      // 删除用户的收藏
      prisma.bookmark.deleteMany({
        where: { userId }
      }),
      
      // 删除用户的关注关系
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId },
            { followingId: userId }
          ]
        }
      }),
      
      // 删除用户的评论
      prisma.comment.deleteMany({
        where: { authorId: userId }
      }),
      
      // 删除用户的文章
      prisma.post.deleteMany({
        where: { authorId: userId }
      }),
      
      // 最后删除用户
      prisma.user.delete({
        where: { id: userId }
      })
    ]);
    
    return NextResponse.json({
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户出错:', error);
    return NextResponse.json(
      { message: '删除用户时发生错误' },
      { status: 500 }
    );
  }
} 