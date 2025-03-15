import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 点赞文章
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "未授权" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { postId } = body;
    
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
    
    // 检查是否已经点赞
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        postId: postId,
        commentId: null,
      },
    });
    
    if (existingLike) {
      return NextResponse.json(
        { message: "已经点赞过该文章" },
        { status: 409 }
      );
    }
    
    // 创建点赞
    const like = await prisma.like.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    });
    
    return NextResponse.json(
      { message: "点赞成功", like },
      { status: 201 }
    );
  } catch (error) {
    console.error("点赞文章错误:", error);
    return NextResponse.json(
      { message: "点赞文章时发生错误" },
      { status: 500 }
    );
  }
}

// 取消点赞文章
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "未授权" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    
    if (!postId) {
      return NextResponse.json(
        { message: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 检查点赞是否存在
    const like = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        postId: postId,
        commentId: null,
      },
    });
    
    if (!like) {
      return NextResponse.json(
        { message: "未点赞该文章" },
        { status: 404 }
      );
    }
    
    // 删除点赞
    await prisma.like.delete({
      where: {
        id: like.id,
      },
    });
    
    return NextResponse.json(
      { message: "取消点赞成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("取消点赞文章错误:", error);
    return NextResponse.json(
      { message: "取消点赞文章时发生错误" },
      { status: 500 }
    );
  }
} 