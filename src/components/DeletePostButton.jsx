"use client";

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DeletePostButton({ postId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '删除失败');
      }
      
      // 删除成功，显示通知并刷新页面或重定向
      toast.success('文章已成功删除');
      
      // 如果在文章详情页，则返回首页，否则刷新当前页面
      if (window.location.pathname.includes(`/posts/${postId}`)) {
        router.push('/');
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('删除帖子时出错:', error);
      toast.error(error.message || '删除帖子时发生错误，请稍后再试');
      setShowConfirm(false);
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
              {isDeleting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>删除中...</span>
                </>
              ) : (
                <>
                  <Trash2 size={12} />
                  <span>确认删除</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 