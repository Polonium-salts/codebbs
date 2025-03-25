'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Spinner from './ui/Spinner';
import { useSocket } from '@/lib/socketClient';
import EmojiPicker from './EmojiPicker';

const SendMessageForm = ({ recipientId, recipientName, onSuccess, sendMessage }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useSocket();
  const textareaRef = useRef(null);
  
  // 自动调整文本域高度
  useEffect(() => {
    if (textareaRef.current) {
      // 先将高度设置为自动，以便获取内容的自然高度
      textareaRef.current.style.height = 'auto';
      // 再设置为实际内容的高度（最小为24px）
      const newHeight = Math.max(24, Math.min(120, textareaRef.current.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  // 处理键盘事件
  const handleKeyDown = (e) => {
    // Enter发送，Shift+Enter换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('消息内容不能为空');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 如果提供了自定义发送方法（通过WebSocket发送），则使用它
      if (sendMessage && typeof sendMessage === 'function') {
        const success = await sendMessage(message.trim());
        
        if (success) {
          toast.success(`已成功发送消息给 ${recipientName}`);
          setMessage('');
          
          // 如果提供了成功回调，则调用
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
          }
        } else {
          throw new Error('发送消息失败');
        }
      } else {
        // 默认的HTTP请求发送方式
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: message.trim(),
            receiverId: recipientId,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '发送消息失败');
        }
        
        toast.success(`已成功发送消息给 ${recipientName}`);
        setMessage('');
        
        // 如果提供了成功回调，则调用
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('发送消息时出错:', err);
      setError(err.message || '发送消息时发生错误，请稍后再试');
      toast.error(err.message || '发送消息失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 插入表情
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    // 选择表情后聚焦输入框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  return (
    <div className="border rounded-lg p-2 bg-card">
      <h3 className="text-sm font-medium mb-2">发送给 {recipientName}</h3>
      
      {error && (
        <div className="mb-2 p-2 bg-destructive/10 text-destructive rounded-md text-xs">
          {error}
        </div>
      )}
      
      {!isConnected && (
        <div className="mb-2 p-2 bg-amber-50 text-amber-700 rounded-md text-xs flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          消息服务已断开
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-grow relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (按Enter发送，Shift+Enter换行)"
            className="w-full p-1.5 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none text-sm min-h-[32px] max-h-[120px] overflow-auto"
            disabled={loading}
          />
          <div className="absolute right-1 bottom-1 flex items-center">
            <EmojiPicker 
              onEmojiSelect={handleEmojiSelect} 
              buttonClassName="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            />
          </div>
          {message && (
            <span className="absolute right-8 bottom-1 text-xs text-muted-foreground">
              {message.length} / 500
            </span>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 flex items-center text-xs whitespace-nowrap"
        >
          {loading ? (
            <>
              <Spinner className="w-3 h-3 mr-1" />
              发送
            </>
          ) : (
            '发送'
          )}
        </button>
      </form>
      
      <div className="mt-1 text-xs text-muted-foreground text-right">
        提示: 按 Enter 发送, Shift+Enter 换行
      </div>
    </div>
  );
};

export default SendMessageForm; 