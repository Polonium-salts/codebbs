import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 获取用户的收藏列表
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: "缺少用户ID" },
        { status: 400 }
      );
    }
    
    // 只有自己可以查看自己的收藏
    if (!session || session.user.id !== userId) {
      return NextResponse.json(
        { message: "无权查看此用户的收藏" },
        { status: 403 }
      );
    }
    
    // 获取分页参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // 查询用户的收藏
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            views: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
    });
    
    // 获取总数
    const total = await prisma.bookmark.count({
      where: { userId },
    });
    
    return NextResponse.json({
      bookmarks: bookmarks.map(b => ({
        id: b.id,
        createdAt: b.createdAt,
        post: b.post,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取收藏列表错误:", error);
    return NextResponse.json(
      { message: "获取收藏列表时发生错误" },
      { status: 500 }
    );
  }
} 