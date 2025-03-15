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
  const searchRef = useRef(null);
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

  // 处理点击事件以关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
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
          {session && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex items-center space-x-2">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent" />
                    <div className="absolute inset-[1px] rounded-full bg-card flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {session.user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.user.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  </div>
                </div>
              </div>
            </div>
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
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function LoadingSpinner(props) {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
} 