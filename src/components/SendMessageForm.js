'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from './ui/Spinner';

const SendMessageForm = ({ recipientId, recipientName, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('消息内容不能为空');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
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
      
    } catch (err) {
      console.error('发送消息时出错:', err);
      setError(err.message || '发送消息时发生错误，请稍后再试');
      toast.error(err.message || '发送消息失败');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-medium mb-3">发送私信给 {recipientName}</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入您想发送的消息..."
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            disabled={loading}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                发送中...
              </>
            ) : (
              '发送消息'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendMessageForm; 