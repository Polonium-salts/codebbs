"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const inputRef = useRef(null);

  // 处理搜索查询
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('搜索请求失败');
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('搜索错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索输入防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 处理点击事件以关闭搜索结果和用户菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      {/* Top gradient banner */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500"></div>
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container relative z-10 h-16 flex items-center justify-between lg:pl-72">
        <div className="block lg:hidden">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative p-1">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <LogoIcon className="h-6 w-6 relative z-10" />
            </div>
            <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Forum App
            </span>
          </Link>
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg relative" ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索文章、用户..."
                className="w-full bg-background border border-border/50 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
              />
              <button 
                type="submit"
                className="absolute inset-y-0 left-0 flex items-center justify-center pl-3"
              >
                {isLoading ? (
                  <LoadingSpinner className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </form>

            {/* 搜索结果下拉框 */}
            {showResults && searchResults && (
              <div className="absolute mt-1 w-full bg-card rounded-md shadow-lg border border-border/50 max-h-[70vh] overflow-y-auto z-50">
                {/* 帖子结果 */}
                {searchResults.posts.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">文章</h3>
                    <div className="space-y-2">
                      {searchResults.posts.map(post => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.id}`}
                          className="block p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium line-clamp-1">{post.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span>by {post.author.name}</span>
                            <span>•</span>
                            <span>{post.category.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {searchResults.posts.length >= 10 && (
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        className="block text-center text-primary text-sm mt-2 hover:underline"
                        onClick={() => setShowResults(false)}
                      >
                        查看更多结果
                      </Link>
                    )}
                  </div>
                )}

                {/* 用户结果 */}
                {searchResults.users.length > 0 && (
                  <div className="p-3 border-t border-border/50">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">用户</h3>
                    <div className="space-y-2">
                      {searchResults.users.map(user => (
                        <Link
                          key={user.id}
                          href={`/users/${user.id}`}
                          className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img 
                                src={user.image || `https://ui-avatars.com/api/?name=${user.name}`}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user._count.posts} 篇文章</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 无结果 */}
                {searchResults.posts.length === 0 && searchResults.users.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    未找到与 "{searchResults.query}" 相关的内容
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {session ? (
            <div className="flex items-center space-x-4">
              <div 
                className="relative cursor-pointer"
                onClick={() => setShowUserMenu(!showUserMenu)}
                ref={userMenuRef}
              >
                <div className="flex items-center space-x-2">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent" />
                    <div className="absolute inset-[1px] rounded-full bg-card flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {session.user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-sm font-medium">{session.user.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  </div>
                </div>
                
                {/* 用户菜单下拉框 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg border border-border/50 overflow-hidden z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                        账户
                      </div>
                      <Link 
                        href={`/users/${session.user.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        个人主页
                      </Link>
                      <Link
                        href="/messages"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                        </svg>
                        消息中心
                      </Link>
                      <Link 
                        href="/follows"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        关注管理
                      </Link>
                      <Link 
                        href="/bookmarks"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                        </svg>
                        我的收藏
                      </Link>
                    </div>
                    <div className="border-t border-border/50 p-2">
                      <button 
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-1 text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function LogoIcon(props) {
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
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function SearchIcon(props) {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function LoadingSpinner(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${props.className || ""}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
} 