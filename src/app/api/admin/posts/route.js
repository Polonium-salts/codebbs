import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 每页显示的文章数量
const PAGE_SIZE = 10;

// 获取文章列表
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
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'all';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // 构建查询条件
    const where = {};
    
    // 添加搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }
    
    // 添加分类条件
    if (category) {
      where.categoryId = category;
    }
    
    // 添加状态条件
    if (status !== 'all') {
      where.published = status === 'published';
    }
    
    // 构建排序条件
    const orderBy = {};
    
    // 根据不同的排序字段设置排序
    switch (sortField) {
      case 'title':
        orderBy.title = sortDirection;
        break;
      case 'views':
        orderBy.views = sortDirection;
        break;
      case 'category':
        orderBy.category = { name: sortDirection };
        break;
      case 'author':
        orderBy.author = { name: sortDirection };
        break;
      case 'updatedAt':
        orderBy.updatedAt = sortDirection;
        break;
      default:
        orderBy.createdAt = sortDirection;
    }
    
    // 获取总记录数
    const totalCount = await prisma.post.count({
      where
    });
    
    // 计算总页数
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    // 获取当前页的文章
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    });
    
    return NextResponse.json({
      posts,
      page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error('获取文章列表出错:', error);
    return NextResponse.json(
      { message: '获取文章列表时发生错误' },
      { status: 500 }
    );
  }
}

// 删除文章
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
    
    // 获取要删除的文章ID
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    
    if (!postId) {
      return NextResponse.json(
        { message: '文章ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查文章是否存在
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        comments: true
      }
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 使用事务删除文章及其相关数据
    await prisma.$transaction(async (tx) => {
      // 删除文章的所有评论
      if (existingPost.comments.length > 0) {
        await tx.comment.deleteMany({
          where: { postId }
        });
      }
      
      // 删除文章的所有点赞
      await tx.like.deleteMany({
        where: { postId }
      });
      
      // 删除文章的所有收藏
      await tx.bookmark.deleteMany({
        where: { postId }
      });
      
      // 删除文章
      await tx.post.delete({
        where: { id: postId }
      });
    });
    
    return NextResponse.json({
      message: '文章删除成功'
    });
  } catch (error) {
    console.error('删除文章出错:', error);
    return NextResponse.json(
      { message: '删除文章时发生错误' },
      { status: 500 }
    );
  }
} 