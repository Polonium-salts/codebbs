"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const fetchResults = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("搜索请求失败");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("搜索错误:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">搜索</h1>
          <p className="text-muted-foreground">请在顶部搜索栏输入关键词进行搜索</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">搜索结果</h1>
        <p className="text-muted-foreground">
          {isLoading
            ? "正在搜索..."
            : searchResults
            ? `找到 ${searchResults.posts.length + searchResults.users.length} 条与 "${query}" 相关的结果`
            : "加载中..."}
        </p>
      </div>

      {/* 选项卡 */}
      <div className="border-b border-border mb-6">
        <div className="flex -mb-px">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "posts"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            文章
            {searchResults && (
              <span className="ml-2 text-xs bg-accent/50 px-2 py-0.5 rounded-full">
                {searchResults.posts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "users"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            用户
            {searchResults && (
              <span className="ml-2 text-xs bg-accent/50 px-2 py-0.5 rounded-full">
                {searchResults.users.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* 文章选项卡内容 */}
          {activeTab === "posts" && searchResults && (
            <div className="space-y-6">
              {searchResults.posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  未找到与 "{query}" 相关的文章
                </div>
              ) : (
                searchResults.posts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-border/50 rounded-lg p-6 hover:shadow-md transition-shadow bg-card"
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <Link href={`/posts/${post.id}`}>
                          <h2 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="avatar">
                              <div className="w-6 h-6 rounded-full overflow-hidden">
                                <img
                                  src={post.author.image || `https://ui-avatars.com/api/?name=${post.author.name}`}
                                  alt={post.author.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>
                            <span>{post.author.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span className="badge bg-secondary/10 text-secondary border-secondary/20">
                            {post.category.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 用户选项卡内容 */}
          {activeTab === "users" && searchResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.users.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  未找到与 "{query}" 相关的用户
                </div>
              ) : (
                searchResults.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/users/${user.id}`}
                    className="border border-border/50 rounded-lg p-6 hover:shadow-md transition-shadow bg-card flex flex-col items-center text-center"
                  >
                    <div className="avatar mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <img
                          src={user.image || `https://ui-avatars.com/api/?name=${user.name}`}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {user.email}
                    </p>
                    <div className="badge badge-outline">
                      {user._count.posts} 篇文章
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 