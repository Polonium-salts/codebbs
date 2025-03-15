import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 获取用户详细信息
export async function GET(request, { params }) {
  try {
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: "缺少用户ID" },
        { status: 400 }
      );
    }
    
    // 查询用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    }
    
    // 查询用户的文章
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        views: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    
    // 统计用户获得的总点赞数
    const totalLikes = await prisma.like.count({
      where: {
        post: {
          authorId: userId,
        },
      },
    });
    
    // 返回完整的用户信息
    return NextResponse.json({
      user: {
        ...user,
        totalLikes,
        recentPosts: posts,
      },
    });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return NextResponse.json(
      { message: "获取用户信息时发生错误" },
      { status: 500 }
    );
  }
} 