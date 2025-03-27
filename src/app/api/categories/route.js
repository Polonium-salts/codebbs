import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 获取所有分类
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取分类列表出错:", error);
    return NextResponse.json(
      { message: "获取分类列表失败" },
      { status: 500 }
    );
  }
} 