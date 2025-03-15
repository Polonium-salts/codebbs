"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("following");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFollowData();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  async function fetchFollowData() {
    try {
      setIsLoading(true);
      
      // 获取关注列表
      const followingResponse = await fetch('/api/users/follow?type=following');
      
      // 获取粉丝列表
      const followersResponse = await fetch('/api/users/follow?type=followers');
      
      if (!followingResponse.ok || !followersResponse.ok) {
        throw new Error('获取好友数据失败');
      }
      
      const followingData = await followingResponse.json();
      const followersData = await followersResponse.json();
      
      setFollowing(followingData.users);
      setFollowers(followersData.users);
    } catch (error) {
      console.error('获取好友数据时出错:', error);
      setError('获取好友数据时出错，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFollow(userId) {
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('关注用户失败');
      }
      
      // 刷新好友数据
      fetchFollowData();
    } catch (error) {
      console.error('关注用户时出错:', error);
      alert('关注失败，请重试');
    }
  }

  async function handleUnfollow(userId) {
    try {
      const response = await fetch('/api/users/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('取消关注用户失败');
      }
      
      // 刷新好友数据
      fetchFollowData();
    } catch (error) {
      console.error('取消关注用户时出错:', error);
      alert('取消关注失败，请重试');
    }
  }

  // 检查是否正在关注某个用户
  function isFollowing(userId) {
    return following.some(user => user.id === userId);
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold mb-4">请先登录</h2>
          <p className="text-muted-foreground mb-6">您需要登录后才能查看好友列表</p>
          <Link 
            href="/login?callbackUrl=/friends" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">好友</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="following">我的关注 ({following.length})</TabsTrigger>
          <TabsTrigger value="followers">我的粉丝 ({followers.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="following">
          {following.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
              <p className="text-muted-foreground">您还没有关注任何人</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {following.map(user => (
                <div key={user.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 mr-4">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {user.name?.[0] || user.email?.[0] || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Link 
                      href={`/users/${user.id}`}
                      className="font-medium text-lg hover:text-primary transition-colors"
                    >
                      {user.name || "用户"}
                    </Link>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleUnfollow(user.id)}
                    className="ml-4 flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md px-3 py-1.5 text-sm transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>已关注</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="followers">
          {followers.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
              <p className="text-muted-foreground">您还没有粉丝</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {followers.map(user => (
                <div key={user.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 mr-4">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {user.name?.[0] || user.email?.[0] || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Link 
                      href={`/users/${user.id}`}
                      className="font-medium text-lg hover:text-primary transition-colors"
                    >
                      {user.name || "用户"}
                    </Link>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  
                  {isFollowing(user.id) ? (
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="ml-4 flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md px-3 py-1.5 text-sm transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>已关注</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFollow(user.id)}
                      className="ml-4 flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>关注</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 