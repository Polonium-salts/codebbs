import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 管理员回复评论
export async function POST(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取请求体
    const data = await request.json();
    
    // 验证必填字段
    if (!data.content || !data.content.trim()) {
      return NextResponse.json(
        { message: '评论内容不能为空' },
        { status: 400 }
      );
    }
    
    if (!data.postId) {
      return NextResponse.json(
        { message: '文章ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查父评论是否存在（如果提供了parentId）
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId }
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { message: '父评论不存在' },
          { status: 404 }
        );
      }
    }
    
    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: data.postId }
    });
    
    if (!post) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 创建回复评论
    const newComment = await prisma.comment.create({
      data: {
        content: data.content,
        author: {
          connect: { id: session.user.id }
        },
        post: {
          connect: { id: data.postId }
        },
        ...(data.parentId && {
          parent: {
            connect: { id: data.parentId }
          }
        }),
        status: 'approved', // 管理员的评论默认为已批准状态
        isAdminReply: true  // 标记为管理员的回复
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    
    return NextResponse.json({
      message: '回复成功',
      comment: newComment
    }, { status: 201 });
  } catch (error) {
    console.error('回复评论出错:', error);
    return NextResponse.json(
      { message: '回复评论时发生错误' },
      { status: 500 }
    );
  }
} 