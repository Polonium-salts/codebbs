import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const category = await prisma.category.findUnique({
      where: {
        id: params.id
      },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { message: '分类不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('获取分类信息出错:', error);
    return NextResponse.json(
      { message: '获取分类信息失败' },
      { status: 500 }
    );
  }
} 