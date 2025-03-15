import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 删除帖子
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录再执行此操作' },
        { status: 401 }
      );
    }
    
    const postId = params.id;
    
    // 获取帖子信息以检查权限
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });
    
    // 检查帖子是否存在
    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      );
    }
    
    // 检查用户是否有权限删除帖子（必须是帖子作者或管理员）
    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '您没有权限删除此帖子' },
        { status: 403 }
      );
    }
    
    // 删除帖子前，先删除相关的评论、点赞等
    await prisma.$transaction([
      // 删除帖子的评论的点赞
      prisma.like.deleteMany({
        where: {
          comment: {
            postId: postId
          }
        }
      }),
      // 删除帖子的评论
      prisma.comment.deleteMany({
        where: { postId: postId }
      }),
      // 删除帖子的点赞
      prisma.like.deleteMany({
        where: { postId: postId }
      }),
      // 删除帖子的收藏
      prisma.bookmark.deleteMany({
        where: { postId: postId }
      }),
      // 最后删除帖子
      prisma.post.delete({
        where: { id: postId }
      })
    ]);
    
    return NextResponse.json(
      { message: '帖子已成功删除' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('删除帖子时出错:', error);
    return NextResponse.json(
      { error: '删除帖子时发生错误' },
      { status: 500 }
    );
  }
} 