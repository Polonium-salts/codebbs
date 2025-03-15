import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 收藏文章
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
    
    // 检查是否已经收藏
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    });
    
    if (existingBookmark) {
      return NextResponse.json(
        { message: "已经收藏过该文章" },
        { status: 409 }
      );
    }
    
    // 创建收藏
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    });
    
    return NextResponse.json(
      { message: "收藏成功", bookmark },
      { status: 201 }
    );
  } catch (error) {
    console.error("收藏文章错误:", error);
    return NextResponse.json(
      { message: "收藏文章时发生错误" },
      { status: 500 }
    );
  }
}

// 取消收藏文章
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
    
    // 检查收藏是否存在
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    });
    
    if (!bookmark) {
      return NextResponse.json(
        { message: "未收藏该文章" },
        { status: 404 }
      );
    }
    
    // 删除收藏
    await prisma.bookmark.delete({
      where: {
        id: bookmark.id,
      },
    });
    
    return NextResponse.json(
      { message: "取消收藏成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("取消收藏文章错误:", error);
    return NextResponse.json(
      { message: "取消收藏文章时发生错误" },
      { status: 500 }
    );
  }
} 