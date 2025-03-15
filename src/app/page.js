import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

async function getLatestPosts() {
  try {
    return await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        author: { select: { name: true, image: true } },
        category: { select: { name: true } },
        _count: { select: { comments: true } }
      }
    });
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    return [];
  }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      include: {
        _count: { select: { posts: true } }
      }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function Home() {
  const [latestPosts, categories] = await Promise.all([
    getLatestPosts(),
    getCategories()
  ]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10 px-6 py-12 md:py-16 lg:py-20 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">欢迎来到我们的论坛</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">分享你的想法，探索新的知识，和社区一起成长。</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/posts/create" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all">
              创建新讨论
            </Link>
            <Link href="/categories" className="px-6 py-3 bg-blue-700 bg-opacity-30 text-white border border-white border-opacity-20 rounded-lg hover:bg-opacity-40 transition-all">
              浏览分类
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Content - Latest Discussions */}
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">最新讨论</h2>
            <Link href="/posts" className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
              查看全部 →
            </Link>
          </div>

          {latestPosts.length === 0 ? (
            <div className="card bg-base-100 shadow-sm rounded-xl p-8 text-center">
              <p className="text-muted-foreground">暂无讨论。成为第一个发起讨论的人！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestPosts.map((post) => (
                <div key={post.id} className="card bg-card shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden border border-border/40">
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img 
                            src={post.author.image || `https://ui-avatars.com/api/?name=${post.author.name}`} 
                            alt={post.author.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{post.author.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <div className="badge bg-secondary/10 text-secondary border-secondary/20">
                          {post.category.name}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">
                      <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

        {/* Sidebar */}
        <div className="md:col-span-4">
          <div className="space-y-6">
            {/* Community Card */}
            <div className="card bg-card shadow-sm rounded-xl overflow-hidden border border-border/40">
              <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-4">
                <h3 className="font-bold text-lg">社区公告</h3>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-4">加入我们的社区，探索和分享知识。</p>
                <Link href="/register" className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  立即加入
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div className="card bg-card shadow-sm rounded-xl overflow-hidden border border-border/40">
              <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-4">
                <h3 className="font-bold text-lg">分类浏览</h3>
              </div>
              <div className="p-4">
                <div className="space-y-1">
                  {categories.length === 0 ? (
                    <p className="text-muted-foreground p-2">暂无分类。</p>
                  ) : (
                    categories.map(category => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.id}`}
                        className="flex justify-between items-center p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                      >
                        <span>{category.name}</span>
                        <span className="bg-accent/50 text-xs px-2 py-0.5 rounded-full">
                          {category._count.posts}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
