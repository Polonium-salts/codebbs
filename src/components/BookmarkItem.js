'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function BookmarkItem({ bookmark, onRemove, showRemoveButton = true }) {
  const [isRemoving, setIsRemoving] = useState(false);
  
  const handleRemoveBookmark = async () => {
    if (isRemoving) return;
    
    try {
      setIsRemoving(true);
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: bookmark.post.id }),
      });
      
      if (response.ok) {
        toast.success('已取消收藏');
        if (onRemove) {
          onRemove(bookmark.id);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
      toast.error('网络错误，请稍后再试');
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="relative w-8 h-8 mr-3">
            <Image
              src={bookmark.post.author.image || '/images/default-avatar.png'}
              alt={bookmark.post.author.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <Link href={`/users/${bookmark.post.author.id}`} className="text-sm font-medium hover:underline">
              {bookmark.post.author.name}
            </Link>
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(bookmark.post.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        
        <Link href={`/posts/${bookmark.post.id}`}>
          <h2 className="text-xl font-bold mb-2 hover:text-blue-600 transition-colors">
            {bookmark.post.title}
          </h2>
        </Link>
        
        <p className="text-gray-600 mb-4">
          {bookmark.post.content.length > 200
            ? `${bookmark.post.content.substring(0, 200)}...`
            : bookmark.post.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
              {bookmark.post.category.name}
            </span>
            <span className="text-xs text-gray-500 mr-2">
              {bookmark.post.views} 浏览
            </span>
            <span className="text-xs text-gray-500">
              {bookmark.post._count.comments} 评论
            </span>
          </div>
          
          {showRemoveButton && (
            <button 
              onClick={handleRemoveBookmark}
              disabled={isRemoving}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              {isRemoving ? '处理中...' : '取消收藏'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 