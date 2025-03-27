import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        categoryId: params.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('获取分类文章列表出错:', error);
    return NextResponse.json(
      { message: '获取分类文章列表失败' },
      { status: 500 }
    );
  }
} 