import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 记录文章分享
export async function POST(request) {
  try {
    const body = await request.json();
    const { postId, platform } = body;
    
    if (!postId) {
      return NextResponse.json(
        { message: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!post) {
      return NextResponse.json(
        { message: "文章不存在" },
        { status: 404 }
      );
    }
    
    // 这里可以记录分享统计数据到数据库
    // 目前简单记录到 console
    console.log(`文章 ${postId} 被分享到 ${platform || '未知平台'}`);
    
    // 这里可以添加到数据库，例如：
    /*
    await prisma.shareLog.create({
      data: {
        postId,
        platform: platform || 'unknown',
        timestamp: new Date()
      }
    });
    */
    
    return NextResponse.json(
      { message: "分享记录成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("记录分享错误:", error);
    return NextResponse.json(
      { message: "记录分享时发生错误" },
      { status: 500 }
    );
  }
} 