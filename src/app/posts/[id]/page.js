import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import CommentForm from "@/components/CommentForm";
import CommentList from "@/components/CommentList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 导入客户端包装组件
import ArticleTabsWrapper from "@/components/ArticleTabsWrapper";

async function getPost(id) {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: true,
        _count: { select: { comments: true, likes: true } }
      }
    });

    if (!post) return null;

    // Update view count
    await prisma.post.update({
      where: { id },
      data: { views: post.views + 1 }
    });

    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

async function getComments(postId) {
  try {
    return await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, image: true } }
      }
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export default async function PostPage({ params }) {
  const session = await getServerSession(authOptions);
  const [post, comments] = await Promise.all([
    getPost(params.id),
    getComments(params.id)
  ]);

  if (!post) {
    notFound();
  }

  // 序列化日期，避免传递日期对象给客户端组件
  const serializedPost = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: {
      ...post.author
    },
    category: {
      ...post.category
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </Link>
      </div>

      {/* 使用客户端包装组件，只传递序列化后的post */}
      <ArticleTabsWrapper post={serializedPost} />

      <div className="bg-card border border-border/60 rounded-lg overflow-hidden mt-12">
        <div className="border-b border-border/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">评论 ({comments.length})</h2>
            {!session && (
              <div className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">登录</Link>
                <span className="mx-1">或</span>
                <Link href="/register" className="text-primary hover:underline">注册</Link>
                <span className="ml-1">后参与讨论</span>
              </div>
            )}
          </div>
          
          {session && (
            <div className="bg-accent/5 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="avatar">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}`} 
                      alt={session.user.name || 'User'} 
                      className="object-cover h-full w-full"
                    />
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {session.user.name || 'User'}
                </div>
              </div>
              <CommentForm postId={post.id} />
            </div>
          )}
          
          <div className="pt-2">
            <CommentList comments={comments} />
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          最后更新于 {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
} 