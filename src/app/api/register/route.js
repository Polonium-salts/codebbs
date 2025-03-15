import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, bio, image } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "缺少必要字段" },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        bio: bio || null,
        image: image || null,
      },
    });

    // 返回不包含密码的用户信息
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "用户注册成功",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册错误:", error);
    return NextResponse.json(
      { message: "注册过程中发生错误" },
      { status: 500 }
    );
  }
} 