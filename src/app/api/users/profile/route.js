import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 更新用户资料
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "未授权" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, bio, image } = body;
    
    // 至少需要一个字段
    if (!name && !bio && !image) {
      return NextResponse.json(
        { message: "至少需要提供一个要更新的字段" },
        { status: 400 }
      );
    }
    
    // 准备更新数据
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    
    // 更新用户资料
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({
      message: "用户资料更新成功",
      user: updatedUser,
    });
  } catch (error) {
    console.error("更新用户资料错误:", error);
    return NextResponse.json(
      { message: "更新用户资料时发生错误" },
      { status: 500 }
    );
  }
} 