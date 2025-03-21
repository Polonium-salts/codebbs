"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EmojiPicker from "./EmojiPicker";

export default function CommentForm({ postId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  // 自动调整文本域高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(100, Math.min(300, textareaRef.current.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [content]);

  // 处理键盘事件（支持Ctrl+Enter发送）
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError("评论内容不能为空");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          postId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "发表评论失败");
      }
      
      setContent("");
      router.refresh();
    } catch (error) {
      setError(error.message || "出现错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 处理表情选择
  const handleEmojiSelect = (emoji) => {
    setContent(prev => prev + emoji);
    // 选择表情后聚焦输入框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  if (!session) return null;
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-600 text-sm">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none min-h-[100px] bg-card text-sm"
          placeholder="写下你的评论... (Ctrl+Enter发送)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          required
        ></textarea>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground flex items-center">
            <span className="mr-2">支持Markdown格式</span>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            {content && (
              <span className="ml-2">
                {content.length} / 1000
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:opacity-70"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                发布中...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                发布评论 (Ctrl+Enter)
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 