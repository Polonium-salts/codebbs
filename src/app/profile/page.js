import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import DeletePostButton from "../../components/DeletePostButton";

// 获取当前登录用户的数据
async function getUserData(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
            followers: true,
            following: true
          }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("获取用户数据失败:", error);
    return null;
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
    console.error("获取用户点赞数据失败:", error);
    return 0;
  }
}

// 获取用户最近的文章
async function getUserPosts(userId) {
  try {
    return await prisma.post.findMany({
      where: { 
        authorId: userId,
        published: true
      },
      orderBy: { createdAt: "desc" },
      take: 10, // 增加显示的文章数量
      include: {
        category: { select: { name: true } },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });
  } catch (error) {
    console.error("获取用户文章失败:", error);
    return [];
  }
}

export default async function ProfilePage() {
  // 获取用户会话
  const session = await getServerSession(authOptions);
  
  // 如果未登录，重定向到登录页面
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/profile");
  }
  
  // 获取用户数据
  const [userData, userLikes, userPosts] = await Promise.all([
    getUserData(session.user.id),
    getUserLikes(session.user.id),
    getUserPosts(session.user.id)
  ]);
  
  // 如果找不到用户数据，显示错误
  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>获取用户数据失败，请重新登录或稍后再试。</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">个人资料</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左侧资料卡片 */}
        <div className="md:col-span-1">
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="p-6 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
                {userData.image ? (
                  <img 
                    src={userData.image} 
                    alt={userData.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {userData.name?.[0] || userData.email?.[0] || "U"}
                    </span>
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-bold mb-1">{userData.name}</h2>
              <p className="text-muted-foreground mb-4">{userData.email}</p>
              
              {userData.bio && (
                <div className="bg-accent/5 p-4 rounded-lg border border-border/40 w-full mb-4">
                  <p className="text-sm">{userData.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{userData._count.posts}</div>
                  <div className="text-xs text-muted-foreground">文章</div>
                </div>
                
                <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{userData._count.comments}</div>
                  <div className="text-xs text-muted-foreground">评论</div>
                </div>
                
                <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{userData._count.followers}</div>
                  <div className="text-xs text-muted-foreground">粉丝</div>
                </div>
                
                <div className="bg-accent/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{userData._count.following}</div>
                  <div className="text-xs text-muted-foreground">关注</div>
                </div>
                
                <div className="bg-accent/20 rounded-lg px-4 py-2 text-center col-span-2">
                  <div className="text-2xl font-bold">{userLikes}</div>
                  <div className="text-xs text-muted-foreground">获赞</div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                注册时间：{new Date(userData.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧编辑表单 */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">编辑个人资料</h3>
            <ProfileForm user={userData} />
          </div>
          
          {/* 用户最近的文章 */}
          <div className="bg-card border border-border/50 rounded-xl p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">我的文章</h3>
              <a 
                href="/posts/create" 
                className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                新建文章
              </a>
            </div>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">您还没有发布任何文章</p>
                <a href="/posts/create" className="mt-2 inline-block text-primary hover:underline">
                  立即创建您的第一篇文章 →
                </a>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {userPosts.map((post) => (
                  <div key={post.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <a
                        href={`/posts/${post.id}`}
                        className="text-lg font-medium hover:text-primary transition-colors max-w-md"
                      >
                        {post.title}
                      </a>
                      
                      <DeletePostButton postId={post.id} />
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">
                        {post.category.name}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        {post._count.comments}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        {post._count.likes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 