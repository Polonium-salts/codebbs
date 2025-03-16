import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 审核评论
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
    
    // 获取请求体
    const data = await request.json();
    
    // 验证必填字段
    if (!data.id) {
      return NextResponse.json(
        { message: '评论ID不能为空' },
        { status: 400 }
      );
    }
    
    if (!data.status || !['approved', 'rejected', 'pending'].includes(data.status)) {
      return NextResponse.json(
        { message: '状态值无效，必须为 approved、rejected 或 pending' },
        { status: 400 }
      );
    }
    
    // 检查评论是否存在
    const existingComment = await prisma.comment.findUnique({
      where: { id: data.id }
    });
    
    if (!existingComment) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      );
    }
    
    // 更新评论状态
    const updatedComment = await prisma.comment.update({
      where: { id: data.id },
      data: { status: data.status }
    });
    
    return NextResponse.json({
      message: `评论已${data.status === 'approved' ? '批准' : data.status === 'rejected' ? '拒绝' : '标记为待审核'}`,
      comment: updatedComment
    });
  } catch (error) {
    console.error('审核评论出错:', error);
    return NextResponse.json(
      { message: '审核评论时发生错误' },
      { status: 500 }
    );
  }
} 