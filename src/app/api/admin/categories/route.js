import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 获取分类列表
export async function GET() {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取所有分类，包括文章数量
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('获取分类列表出错:', error);
    return NextResponse.json(
      { message: '获取分类列表时发生错误' },
      { status: 500 }
    );
  }
}

// 创建或更新分类
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
    
    // 验证必填字段
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { message: '分类名称不能为空' },
        { status: 400 }
      );
    }
    
    // 如果存在ID，则更新分类，否则创建新分类
    let category;
    
    if (data.id) {
      // 检查分类是否存在
      const existingCategory = await prisma.category.findUnique({
        where: { id: data.id }
      });
      
      if (!existingCategory) {
        return NextResponse.json(
          { message: '分类不存在' },
          { status: 404 }
        );
      }
      
      // 检查名称是否已被其他分类使用
      if (data.name !== existingCategory.name) {
        const nameExists = await prisma.category.findFirst({
          where: {
            name: data.name,
            id: { not: data.id }
          }
        });
        
        if (nameExists) {
          return NextResponse.json(
            { message: '分类名称已存在' },
            { status: 400 }
          );
        }
      }
      
      // 更新分类
      category = await prisma.category.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description
        },
        include: {
          _count: {
            select: { posts: true }
          }
        }
      });
      
      return NextResponse.json({
        message: '分类更新成功',
        category
      });
    } else {
      // 检查名称是否已存在
      const nameExists = await prisma.category.findFirst({
        where: { name: data.name }
      });
      
      if (nameExists) {
        return NextResponse.json(
          { message: '分类名称已存在' },
          { status: 400 }
        );
      }
      
      // 创建新分类
      category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description || null
        },
        include: {
          _count: {
            select: { posts: true }
          }
        }
      });
      
      return NextResponse.json({
        message: '分类创建成功',
        category
      }, { status: 201 });
    }
  } catch (error) {
    console.error('创建/更新分类出错:', error);
    return NextResponse.json(
      { message: '创建/更新分类时发生错误' },
      { status: 500 }
    );
  }
}

// 删除分类
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
    
    // 获取要删除的分类ID
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json(
        { message: '分类ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查分类是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { message: '分类不存在' },
        { status: 404 }
      );
    }
    
    // 检查分类是否有关联的文章
    if (existingCategory._count.posts > 0) {
      return NextResponse.json(
        { message: '无法删除包含文章的分类' },
        { status: 400 }
      );
    }
    
    // 删除分类
    await prisma.category.delete({
      where: { id: categoryId }
    });
    
    return NextResponse.json({
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类出错:', error);
    return NextResponse.json(
      { message: '删除分类时发生错误' },
      { status: 500 }
    );
  }
} 