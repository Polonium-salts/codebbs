import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 每页显示的评论数量
const PAGE_SIZE = 10;

// 获取评论列表
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
    const filter = searchParams.get('filter') || 'all';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // 构建查询条件
    const where = {};
    
    // 添加搜索条件
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { author: { name: { contains: search } } },
        { author: { email: { contains: search } } }
      ];
    }
    
    // 添加状态条件
    if (filter !== 'all') {
      where.status = filter;
    }
    
    // 构建排序条件
    const orderBy = {};
    
    // 根据不同的排序字段设置排序
    switch (sortField) {
      case 'author':
        orderBy.author = { name: sortDirection };
        break;
      case 'post':
        orderBy.post = { title: sortDirection };
        break;
      case 'status':
        orderBy.status = sortDirection;
        break;
      default:
        orderBy.createdAt = sortDirection;
    }
    
    // 获取总记录数
    const totalCount = await prisma.comment.count({
      where
    });
    
    // 计算总页数
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    // 获取当前页的评论
    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    });
    
    return NextResponse.json({
      comments,
      page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error('获取评论列表出错:', error);
    return NextResponse.json(
      { message: '获取评论列表时发生错误' },
      { status: 500 }
    );
  }
}

// 删除评论
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
    
    // 获取要删除的评论ID
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json(
        { message: '评论ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查评论是否存在
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        children: true
      }
    });
    
    if (!existingComment) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      );
    }
    
    // 使用事务删除评论及其子评论
    await prisma.$transaction(async (tx) => {
      // 如果有子评论，先删除所有子评论
      if (existingComment.children.length > 0) {
        await tx.comment.deleteMany({
          where: { parentId: commentId }
        });
      }
      
      // 删除评论
      await tx.comment.delete({
        where: { id: commentId }
      });
    });
    
    return NextResponse.json({
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论出错:', error);
    return NextResponse.json(
      { message: '删除评论时发生错误' },
      { status: 500 }
    );
  }
} 