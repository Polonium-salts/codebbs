import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

async function getUser(id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true, comments: true } }
      }
    });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function getUserPosts(userId) {
  try {
    const posts = await prisma.post.findMany({
      where: { 
        authorId: userId,
        published: true 
      },
      include: {
        category: true,
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}

export default async function UserProfilePage({ params }) {
  const [user, posts] = await Promise.all([
    getUser(params.id),
    getUserPosts(params.id)
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Link href="/" className="text-primary hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </Link>
      </div>

      <div className="mb-8 bg-card border border-border/50 rounded-xl p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0">
            <div className="avatar">
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <img 
                  src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} 
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-center sm:text-left">{user.name}</h1>
            <p className="text-muted-foreground mb-4 text-center sm:text-left">{user.email}</p>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{user._count.posts}</div>
                <div className="text-xs text-muted-foreground">文章</div>
              </div>
              
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{user._count.comments}</div>
                <div className="text-xs text-muted-foreground">评论</div>
              </div>
              
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">加入日期</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">最近发布的文章</h2>
        {posts.length === 0 ? (
          <div className="text-center py-8 border border-border/50 rounded-lg bg-card">
            <p className="text-muted-foreground">该用户还没有发布任何文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border border-border/50 rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
                <Link href={`/posts/${post.id}`}>
                  <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground mb-4 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                    <span className="badge bg-secondary/10 text-secondary border-secondary/20">
                      {post.category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                      {post._count.comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                      {post.views}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 