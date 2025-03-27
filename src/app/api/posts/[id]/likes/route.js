import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 获取文章点赞信息和当前用户点赞状态
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const postId = params.id;
    
    if (!postId) {
      return NextResponse.json(
        { message: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      return NextResponse.json(
        { message: "文章不存在" },
        { status: 404 }
      );
    }
    
    // 获取点赞数量
    const likeCount = await prisma.like.count({
      where: {
        postId: postId,
        commentId: null,
      },
    });
    
    // 检查当前用户是否点赞过
    let isLiked = false;
    
    if (session?.user) {
      const userLike = await prisma.like.findFirst({
        where: {
          userId: session.user.id,
          postId: postId,
          commentId: null,
        },
      });
      
      isLiked = !!userLike;
    }
    
    return NextResponse.json(
      { likeCount, isLiked },
      { status: 200 }
    );
  } catch (error) {
    console.error("获取文章点赞信息错误:", error);
    return NextResponse.json(
      { message: "获取文章点赞信息时发生错误" },
      { status: 500 }
    );
  }
} 