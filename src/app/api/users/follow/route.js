import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 关注用户
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
    const { followingId } = body;
    
    if (!followingId) {
      return NextResponse.json(
        { message: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 检查用户是否存在
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
    });
    
    if (!userToFollow) {
      return NextResponse.json(
        { message: "要关注的用户不存在" },
        { status: 404 }
      );
    }
    
    // 不能关注自己
    if (session.user.id === followingId) {
      return NextResponse.json(
        { message: "不能关注自己" },
        { status: 400 }
      );
    }
    
    // 检查是否已经关注
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: followingId,
      },
    });
    
    if (existingFollow) {
      return NextResponse.json(
        { message: "已经关注了该用户" },
        { status: 409 }
      );
    }
    
    // 创建关注关系
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: followingId,
      },
    });
    
    return NextResponse.json(
      { message: "关注成功", follow },
      { status: 201 }
    );
  } catch (error) {
    console.error("关注用户错误:", error);
    return NextResponse.json(
      { message: "关注用户时发生错误" },
      { status: 500 }
    );
  }
}

// 取消关注用户
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
    const followingId = searchParams.get("followingId");
    
    if (!followingId) {
      return NextResponse.json(
        { message: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 检查关注关系是否存在
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: followingId,
      },
    });
    
    if (!follow) {
      return NextResponse.json(
        { message: "未关注该用户" },
        { status: 404 }
      );
    }
    
    // 删除关注关系
    await prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });
    
    return NextResponse.json(
      { message: "取消关注成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("取消关注用户错误:", error);
    return NextResponse.json(
      { message: "取消关注用户时发生错误" },
      { status: 500 }
    );
  }
} 