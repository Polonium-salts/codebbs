"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, ThumbsUp } from 'lucide-react';

export default function LikeButton({ postId, className }) {
  const { data: session, status } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (postId) {
      fetchLikeStatus();
    }
  }, [postId, session]);
  
  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`);
      const data = await response.json();
      
      if (response.ok) {
        setLikeCount(data.likeCount);
        
        if (session?.user) {
          setIsLiked(data.isLiked);
        }
      }
    } catch (error) {
      console.error("获取点赞状态失败:", error);
    }
  };
  
  const handleLike = async () => {
    if (status === 'loading' || isLoading) return;
    
    if (!session) {
      // 如果未登录，提示用户登录
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    setIsLoading(true);
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const url = isLiked 
        ? `/api/posts/like?postId=${postId}`
        : '/api/posts/like';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: !isLiked ? JSON.stringify({ postId }) : undefined
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error("点赞/取消点赞失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleLike}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isLiked 
          ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-foreground' 
          : 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-primary-foreground'
      } ${className || ''}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
      )}
      点赞 ({likeCount})
    </button>
  );
} 