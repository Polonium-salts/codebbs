"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeletePostButton({ postId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 删除成功，刷新页面以更新列表
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || '删除失败，请重试');
        setShowConfirm(false);
      }
    } catch (error) {
      console.error('删除帖子时出错:', error);
      alert('删除帖子时发生错误，请重试');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="relative">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-red-500 hover:text-red-700 transition-colors p-1"
          title="删除帖子"
        >
          <Trash2 size={18} />
        </button>
      ) : (
        <div className="absolute right-0 top-0 bg-card border border-border shadow-lg rounded-md p-3 z-10 min-w-[200px]">
          <p className="text-sm mb-3">确定要删除这篇文章吗？</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 text-xs bg-secondary/20 hover:bg-secondary/30 rounded-md transition-colors"
              disabled={isDeleting}
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-xs bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors flex items-center gap-1"
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 