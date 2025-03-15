import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 检查是否已关注某用户
export async function GET(request) {
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
    
    return NextResponse.json({
      isFollowing: !!follow
    });
  } catch (error) {
    console.error("检查关注状态错误:", error);
    return NextResponse.json(
      { message: "检查关注状态时发生错误" },
      { status: 500 }
    );
  }
} 