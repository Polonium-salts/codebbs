import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 获取用户的粉丝列表
export async function GET(request, { params }) {
  try {
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: "缺少用户ID" },
        { status: 400 }
      );
    }
    
    // 查询用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    }
    
    // 获取分页参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // 查询用户的粉丝
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                posts: true,
              },
            },
          },
        },
      },
    });
    
    // 获取总数
    const total = await prisma.follow.count({
      where: { followingId: userId },
    });
    
    return NextResponse.json({
      followers: followers.map(f => f.follower),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取粉丝列表错误:", error);
    return NextResponse.json(
      { message: "获取粉丝列表时发生错误" },
      { status: 500 }
    );
  }
} 