import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { content, postId } = body;
    
    if (!content || !postId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        postId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    return NextResponse.json(
      { message: "Comment created successfully", comment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the comment" },
      { status: 500 }
    );
  }
} 