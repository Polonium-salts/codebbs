"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { FadeEffect } from "./FadeEffect";
import { motion } from "framer-motion";

const navigation = [
  { name: "首页", href: "/", icon: HomeIcon },
  { name: "文章", href: "/posts", icon: DocumentIcon },
  { name: "分类", href: "/categories", icon: FolderIcon },
  { name: "消息", href: "/messages", icon: MessageSquareIcon },
  { name: "个人主页", href: "/profile", icon: UserIcon },
];

const adminNavigation = [
  { name: "管理后台", href: "/admin/dashboard", icon: LayoutDashboardIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userStats, setUserStats] = useState({
    following: 0,
    followers: 0,
    likes: 0
  });
  const [loading, setLoading] = useState(false);

  // 当用户登录后，获取统计数据
  useEffect(() => {
    if (session?.user) {
      fetchUserStats();
    }
  }, [session]);

  // 获取用户统计数据
  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/stats');
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      } else {
        console.error('获取用户统计数据失败');
      }
    } catch (error) {
      console.error('获取用户统计数据时出错:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="text-xl font-bold">
            Forum App
          </Link>
        </div>
        {session && (
          <FadeEffect duration={0.4} delay={0.1} className="mb-6">
            <div className="rounded-lg border border-border/60 overflow-hidden bg-gradient-to-br from-background to-accent/5">
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                      {session.user.image ? (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || "用户"} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">
                            {session.user.name?.[0] || session.user.email?.[0] || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-1 border border-border/60">
                      <div className="bg-green-500 rounded-full w-3 h-3"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg truncate">
                      {session.user.name || "用户"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                    <Link href="/profile" className="text-xs text-primary hover:underline mt-1 inline-block">
                      查看个人资料
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <Link href="/follows" className="bg-background/60 rounded-md p-2 hover:bg-primary/10 transition-colors">
                    <div className="font-semibold">
                      {loading ? "..." : userStats.following}
                    </div>
                    <div className="text-xs text-muted-foreground">关注</div>
                  </Link>
                  <Link href="/follows" className="bg-background/60 rounded-md p-2 hover:bg-primary/10 transition-colors">
                    <div className="font-semibold">
                      {loading ? "..." : userStats.followers}
                    </div>
                    <div className="text-xs text-muted-foreground">粉丝</div>
                  </Link>
                  <div className="bg-background/60 rounded-md p-2">
                    <div className="font-semibold">
                      {loading ? "..." : userStats.likes}
                    </div>
                    <div className="text-xs text-muted-foreground">获赞</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeEffect>
        )}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item, index) => (
                  <motion.li 
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.1 + index * 0.05,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm font-semibold
                        ${pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 shrink-0 relative z-10" aria-hidden="true" />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </li>
            
            {/* 管理员菜单 */}
            {session?.user?.role === 'ADMIN' && (
              <FadeEffect duration={0.4} delay={0.3}>
                <li>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-2 mb-2">
                    管理选项
                  </div>
                  <ul role="list" className="-mx-2 space-y-1">
                    {adminNavigation.map((item, index) => (
                      <motion.li 
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.3 + index * 0.05,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm font-semibold
                            ${pathname === item.href
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }
                          `}
                        >
                          <item.icon className="h-5 w-5 shrink-0 relative z-10" aria-hidden="true" />
                          <span className="relative z-10">{item.name}</span>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </li>
              </FadeEffect>
            )}
            
            <li className="mt-auto">
              <FadeEffect duration={0.4} delay={0.4}>
                {session ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => signOut()}
                      className="w-full group relative inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-primary transition-colors hover:text-foreground"
                    >
                      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <LogoutIcon className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">退出登录</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="w-full group relative inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-primary transition-colors hover:text-foreground"
                    >
                      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <LoginIcon className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">登录</span>
                    </Link>
                    <Link
                      href="/register"
                      className="w-full group relative inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-primary transition-colors hover:text-foreground"
                    >
                      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <UserPlusIcon className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">注册</span>
                    </Link>
                  </div>
                )}
              </FadeEffect>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

// Icons
function HomeIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DocumentIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function FolderIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LoginIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function LogoutIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UserPlusIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function LayoutDashboardIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function MessageSquareIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ImageIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
} 