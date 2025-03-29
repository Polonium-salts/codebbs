import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getCachedPost } from '@/lib/cache';

// 删除帖子
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录再执行此操作' },
        { status: 401 }
      );
    }
    
    const postId = params.id;
    
    // 获取帖子信息以检查权限
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });
    
    // 检查帖子是否存在
    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      );
    }
    
    // 检查用户是否有权限删除帖子（必须是帖子作者或管理员）
    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '您没有权限删除此帖子' },
        { status: 403 }
      );
    }
    
    // 删除帖子前，先删除相关的评论、点赞等
    await prisma.$transaction([
      // 删除帖子的评论的点赞
      prisma.like.deleteMany({
        where: {
          comment: {
            postId: postId
          }
        }
      }),
      // 删除帖子的评论
      prisma.comment.deleteMany({
        where: { postId: postId }
      }),
      // 删除帖子的点赞
      prisma.like.deleteMany({
        where: { postId: postId }
      }),
      // 删除帖子的收藏
      prisma.bookmark.deleteMany({
        where: { postId: postId }
      }),
      // 最后删除帖子
      prisma.post.delete({
        where: { id: postId }
      })
    ]);
    
    return NextResponse.json(
      { message: '帖子已成功删除' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('删除帖子时出错:', error);
    return NextResponse.json(
      { error: '删除帖子时发生错误' },
      { status: 500 }
    );
  }
}

// 更新帖子
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '请先登录再执行此操作' },
        { status: 401 }
      );
    }
    
    const postId = params.id;
    
    // 获取帖子信息以检查权限
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });
    
    // 检查帖子是否存在
    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      );
    }
    
    // 检查用户是否有权限更新帖子（必须是帖子作者或管理员）
    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '您没有权限更新此帖子' },
        { status: 403 }
      );
    }
    
    // 获取请求数据
    const data = await request.json();
    const { 
      title, 
      content, 
      categoryId,
      published,
      gitPlatform,
      gitOwner,
      gitRepo,
      gitBranch
    } = data;
    
    // 准备更新数据
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (published !== undefined) updateData.published = published;
    
    // 更新Git仓库信息
    if (gitPlatform !== undefined) updateData.gitPlatform = gitPlatform;
    if (gitOwner !== undefined) updateData.gitOwner = gitOwner;
    if (gitRepo !== undefined) updateData.gitRepo = gitRepo;
    if (gitBranch !== undefined) updateData.gitBranch = gitBranch;
    
    // 更新帖子
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
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
    
    return NextResponse.json({
      message: '帖子已成功更新',
      post: updatedPost
    });
    
  } catch (error) {
    console.error('更新帖子时出错:', error);
    return NextResponse.json(
      { error: '更新帖子时发生错误' },
      { status: 500 }
    );
  }
}

// 获取特定ID的文章详情
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const skipViews = searchParams.get('skipViews') === 'true';

    // 使用缓存获取文章
    const post = await getCachedPost(id, async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      
      // 获取文章详情，包含作者、分类和评论数
      const post = await prisma.post.findUnique({
        where: {
          id: id
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true
            }
          },
          category: true,
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true
            }
          }
        }
      });
      
      if (!post) {
        return null;
      }
      
      // 如果用户已登录，检查用户是否已点赞和收藏
      let userLiked = false;
      let userBookmarked = false;
      
      if (userId) {
        // 查找用户是否已点赞此文章
        const like = await prisma.like.findFirst({
          where: {
            userId: userId,
            postId: id,
            commentId: null // 确保commentId为null而非undefined
          }
        });
        
        userLiked = !!like;
        
        // 查找用户是否已收藏此文章
        const bookmark = await prisma.bookmark.findUnique({
          where: {
            userId_postId: {
              userId: userId,
              postId: id
            }
          }
        });
        
        userBookmarked = !!bookmark;
      }
      
      // 增加浏览量，除非明确跳过
      if (!skipViews) {
        await prisma.post.update({
          where: { id: id },
          data: { views: { increment: 1 } }
        });
      }
      
      return {
        ...post,
        userLiked,
        userBookmarked
      };
    }, skipViews);
    
    if (!post) {
      return NextResponse.json(
        { message: '文章不存在或已被删除' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('获取文章详情出错:', error);
    return NextResponse.json(
      { message: '获取文章详情失败', error: error.message },
      { status: 500 }
    );
  }
} 