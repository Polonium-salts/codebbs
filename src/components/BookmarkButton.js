'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

export default function BookmarkButton({ postId, className = '' }) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 只有在用户登录且有postId时才获取收藏状态
    if (session && postId) {
      fetchBookmarkStatus();
    } else {
      setIsLoading(false);
    }
  }, [session, postId]);

  const fetchBookmarkStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookmarks/status?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error('获取收藏状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        toast.success(data.message);
      } else {
        const error = await response.json();
        toast.error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error('网络错误，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={isLoading || !session}
      className={`flex items-center space-x-1 hover:text-yellow-500 transition-colors ${
        isBookmarked ? 'text-yellow-500' : 'text-gray-500'
      } ${className}`}
      title={isBookmarked ? '取消收藏' : '收藏'}
    >
      {isBookmarked ? (
        <BookmarkSolidIcon className="w-5 h-5" />
      ) : (
        <BookmarkIcon className="w-5 h-5" />
      )}
      <span className="text-sm">收藏</span>
    </button>
  );
} 