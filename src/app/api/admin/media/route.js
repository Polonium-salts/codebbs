import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取媒体文件列表
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
    
    // 获取所有媒体文件
    const mediaFiles = await prisma.mediaFile.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(mediaFiles);
  } catch (error) {
    console.error('获取媒体文件列表出错:', error);
    return NextResponse.json(
      { message: '获取媒体文件列表时发生错误' },
      { status: 500 }
    );
  }
}

// 删除媒体文件
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
    
    // 获取要删除的文件ID
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return NextResponse.json(
        { message: '文件ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查文件是否存在
    const existingFile = await prisma.mediaFile.findUnique({
      where: { id: fileId }
    });
    
    if (!existingFile) {
      return NextResponse.json(
        { message: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 实际项目中，这里应该添加删除物理文件的逻辑
    // 例如，从云存储或本地存储中删除文件
    // 示例: await deleteFileFromStorage(existingFile.path);
    
    // 从数据库中删除文件记录
    await prisma.mediaFile.delete({
      where: { id: fileId }
    });
    
    return NextResponse.json({
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除媒体文件出错:', error);
    return NextResponse.json(
      { message: '删除媒体文件时发生错误' },
      { status: 500 }
    );
  }
} 