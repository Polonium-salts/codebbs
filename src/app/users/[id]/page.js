import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import FollowButtonWrapper from "./FollowButtonWrapper";
import SendMessageButtonWrapper from "./SendMessageButtonWrapper";

async function getUser(id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { 
          select: { 
            posts: true, 
            comments: true,
            followers: true,
            following: true,
            bookmarks: true
          } 
        }
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
    return await prisma.post.findMany({
      where: { 
        authorId: userId,
        published: true
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        category: { select: { name: true } },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}

// 获取用户收藏的文章
async function getUserBookmarks(userId) {
  try {
    return await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        post: {
          include: {
            category: { select: { name: true } },
            author: { select: { id: true, name: true, image: true } },
            _count: {
              select: { comments: true, likes: true }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user bookmarks:", error);
    return [];
  }
}

// 获取用户获得的点赞总数
async function getUserLikes(userId) {
  try {
    return await prisma.like.count({
      where: {
        OR: [
          // 用户文章获得的点赞
          {
            post: {
              authorId: userId,
            },
          },
          // 用户评论获得的点赞
          {
            comment: {
              authorId: userId,
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching user likes:", error);
    return 0;
  }
}

export default async function UserProfilePage({ params }) {
  const [user, posts, bookmarks, totalLikes] = await Promise.all([
    getUser(params.id),
    getUserPosts(params.id),
    getUserBookmarks(params.id),
    getUserLikes(params.id)
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-4">
              <h1 className="text-3xl font-bold text-center sm:text-left">{user.name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                <FollowButtonWrapper userId={user.id} />
                <SendMessageButtonWrapper recipientId={user.id} recipientName={user.name} />
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6 text-center sm:text-left">{user.email}</p>
            
            {user.bio && (
              <div className="mb-6 p-4 bg-accent/5 rounded-lg border border-border/40">
                <p className="text-sm">{user.bio}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{user._count.posts}</div>
                <div className="text-xs text-muted-foreground">文章</div>
              </div>
              
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{user._count.comments}</div>
                <div className="text-xs text-muted-foreground">评论</div>
              </div>
              
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{user._count.followers}</div>
                <div className="text-xs text-muted-foreground">粉丝</div>
              </div>
              
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{user._count.following}</div>
                <div className="text-xs text-muted-foreground">关注</div>
              </div>
              
              <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                <div className="text-2xl font-bold">{totalLikes}</div>
                <div className="text-xs text-muted-foreground">获赞</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        {post._count.likes}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {user._count.posts > 5 && (
                <Link href={`/users/${user.id}/posts`} className="block text-center text-primary hover:underline py-2">
                  查看全部 {user._count.posts} 篇文章
                </Link>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">收藏的文章</h2>
          {bookmarks.length === 0 ? (
            <div className="text-center py-8 border border-border/50 rounded-lg bg-card">
              <p className="text-muted-foreground">该用户还没有收藏任何文章</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="border border-border/50 rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
                  <Link href={`/posts/${bookmark.post.id}`}>
                    <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                      {bookmark.post.title}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{bookmark.post.content}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Link href={`/users/${bookmark.post.author.id}`} className="flex items-center gap-1 hover:underline">
                        <img 
                          src={bookmark.post.author.image || `https://ui-avatars.com/api/?name=${bookmark.post.author.name}`} 
                          alt={bookmark.post.author.name}
                          className="h-5 w-5 rounded-full"
                        />
                        <span>{bookmark.post.author.name}</span>
                      </Link>
                      <span className="badge bg-secondary/10 text-secondary border-secondary/20">
                        {bookmark.post.category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        {bookmark.post._count.comments}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        {bookmark.post._count.likes}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {user._count.bookmarks > 5 && (
                <Link href={`/bookmarks?userId=${user.id}`} className="block text-center text-primary hover:underline py-2">
                  查看全部 {user._count.bookmarks} 篇收藏
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 