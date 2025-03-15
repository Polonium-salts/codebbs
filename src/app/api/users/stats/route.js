import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 获取当前用户的统计数据
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "未授权" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // 查询用户关注数
    const followingCount = await prisma.follow.count({
      where: { followerId: userId },
    });
    
    // 查询用户粉丝数
    const followersCount = await prisma.follow.count({
      where: { followingId: userId },
    });
    
    // 查询用户获得的点赞数
    const likesCount = await prisma.like.count({
      where: {
        OR: [
          // 用户文章获得的点赞
          {
            post: {
              authorId: userId,
            },
          },
          // 用户评论获得的点赞
          {
            comment: {
              authorId: userId,
            },
          },
        ],
      },
    });
    
    return NextResponse.json({
      following: followingCount,
      followers: followersCount,
      likes: likesCount,
    });
  } catch (error) {
    console.error("获取用户统计数据错误:", error);
    return NextResponse.json(
      { message: "获取用户统计数据时发生错误" },
      { status: 500 }
    );
  }
} 