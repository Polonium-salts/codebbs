"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// 关注按钮组件
export default function FollowButton({ userId, onSuccess = () => {} }) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 检查是否已经关注该用户
  useEffect(() => {
    if (session?.user && userId && session.user.id !== userId) {
      checkFollowStatus();
    }
  }, [session, userId]);

  // 检查关注状态
  const checkFollowStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/follow/check?followingId=${userId}`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error("检查关注状态时出错:", err);
    } finally {
      setLoading(false);
    }
  };

  // 关注/取消关注操作
  const toggleFollow = async () => {
    if (!session?.user) {
      setError("请先登录");
      return;
    }

    if (session.user.id === userId) {
      setError("不能关注自己");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isFollowing) {
        // 取消关注
        const response = await fetch(`/api/users/follow?followingId=${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setIsFollowing(false);
          onSuccess(false);
        } else {
          const data = await response.json();
          setError(data.message || "取消关注失败");
        }
      } else {
        // 关注
        const response = await fetch(`/api/users/follow`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followingId: userId }),
        });

        if (response.ok) {
          setIsFollowing(true);
          onSuccess(true);
        } else {
          const data = await response.json();
          setError(data.message || "关注失败");
        }
      }
    } catch (err) {
      console.error("操作关注状态时出错:", err);
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 如果是当前用户或未登录，不显示按钮
  if (!session?.user || session.user.id === userId) {
    return null;
  }

  return (
    <div>
      <button
        onClick={toggleFollow}
        disabled={loading}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${isFollowing 
            ? "bg-accent/10 text-accent-foreground hover:bg-accent/20" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"}
          ${loading ? "opacity-70 cursor-not-allowed" : ""}
        `}
      >
        {loading 
          ? "处理中..." 
          : isFollowing 
            ? "已关注" 
            : "关注"}
      </button>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
} 