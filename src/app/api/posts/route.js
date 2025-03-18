import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 创建新文章
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "请先登录再发布文章" },
        { status: 401 }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    const { 
      title, 
      content, 
      categoryId, 
      published = true,
      gitPlatform,
      gitOwner,
      gitRepo,
      gitBranch
    } = data;
    
    // 验证必要字段
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { message: "标题、内容和分类为必填项" },
        { status: 400 }
      );
    }
    
    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return NextResponse.json(
        { message: "所选分类不存在" },
        { status: 404 }
      );
    }
    
    // 创建新文章
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published: !!published,
        authorId: session.user.id,
        categoryId,
        gitPlatform,
        gitOwner,
        gitRepo,
        gitBranch
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        category: true
      }
    });
    
    return NextResponse.json(
      { message: "文章发布成功", post },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建文章出错:", error);
    return NextResponse.json(
      { message: "创建文章时发生错误" },
      { status: 500 }
    );
  }
} 