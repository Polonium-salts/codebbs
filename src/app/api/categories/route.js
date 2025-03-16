import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 获取所有分类
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { posts: true } }
      }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取分类列表出错:", error);
    return NextResponse.json(
      { message: "获取分类列表时发生错误" },
      { status: 500 }
    );
  }
} 