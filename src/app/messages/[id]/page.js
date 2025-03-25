'use client';

import { useState, useEffect, useRef } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import SendMessageForm from '@/components/SendMessageForm';
import { useSocket } from '@/lib/socketClient';
import { useSession } from 'next-auth/react';

const MessageDetailPage = ({ params }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sender, setSender] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  
  // 加载消息
  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    setRetrying(false);
    
    try {
      const session = await getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/messages/${params.id}`);
      
      if (!response.ok) {
        throw new Error('获取消息失败');
      }
      
      const data = await response.json();
      setMessages(data.messages);
      setSender(data.sender);
      
    } catch (err) {
      console.error('获取消息时出错:', err);
      setError('获取消息时发生错误，请稍后再试');
      toast.error('获取消息失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 重试加载
  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      fetchMessages();
    }, 300);
  };
  
  // 标记为已读
  const markAsRead = async (messageId) => {
    try {
      const response = await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });
      
      if (!response.ok) {
        throw new Error('标记已读失败');
      }
      
      // 更新消息状态
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
      
      toast.success('已标记为已读');
      
    } catch (err) {
      console.error('标记已读时出错:', err);
      toast.error('标记已读失败');
    }
  };
  
  // 格式化时间
  const formatTime = (dateString) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN
    });
  };
  
  // 发送消息成功后的回调
  const handleSendSuccess = () => {
    // 重新加载消息列表
    fetchMessages();
  };
  
  // 使用WebSocket发送消息
  const sendMessage = async (content) => {
    if (!session?.user?.id || !socket || !isConnected) {
      toast.error('消息发送失败，请检查网络连接');
      return false;
    }
    
    try {
      // 发送消息到服务器
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: params.id,
          content,
          type: 'PRIVATE'
        }),
      });
      
      // 使用WebSocket发送实时通知
      socket.emit('sendPrivateMessage', {
        senderId: session.user.id,
        receiverId: params.id,
        content
      });
      
      // 添加到本地消息列表
      const newMessage = {
        id: Date.now().toString(), // 临时ID，服务器会分配真正的ID
        content,
        createdAt: new Date().toISOString(),
        senderId: session.user.id,
        receiverId: params.id,
        isRead: true,
        type: 'PRIVATE'
      };
      
      setMessages(prev => [...prev, newMessage]);
      return true;
    } catch (err) {
      console.error('发送消息时出错:', err);
      toast.error('消息发送失败，请稍后再试');
      return false;
    }
  };
  
  // 处理实时消息接收
  useEffect(() => {
    if (!socket || !session?.user?.id) return;
    
    // 监听新消息
    const handleNewMessage = (message) => {
      // 只处理来自当前对话用户的消息
      if (message.senderId === params.id) {
        // 检查是否已存在该消息（防止重复）
        if (messages.some(m => m.id === message.id)) return;
        
        // 添加新消息
        const newMessage = {
          ...message,
          id: message.id || Date.now().toString(),
          receiverId: session.user.id,
          isRead: false
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // 标记为已读
        if (message.id) {
          markAsRead(message.id);
          
          // 通知发送者消息已读
          socket.emit('markAsRead', {
            messageId: message.id,
            receiverId: message.senderId
          });
        }
      }
    };
    
    // 监听消息已读状态更新
    const handleMessageRead = ({ messageId }) => {
      // 更新消息状态
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, isRead: true } : msg)
      );
    };
    
    // 注册事件监听
    socket.on('newMessage', handleNewMessage);
    socket.on('messageRead', handleMessageRead);
    
    return () => {
      // 清理事件监听
      socket.off('newMessage', handleNewMessage);
      socket.off('messageRead', handleMessageRead);
    };
  }, [socket, session, params.id, messages]);
  
  // 初始加载
  useEffect(() => {
    fetchMessages();
  }, [params.id]);
  
  // 滚动到消息底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 渲染消息气泡
  const renderMessageBubble = (message) => {
    const isSender = message.senderId === session?.user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-start gap-2 max-w-[80%] ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 头像 */}
          <div className="flex-shrink-0">
            {isSender ? (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {sender?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          
          {/* 消息内容 */}
          <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
            {/* 发送者名称 */}
            <span className="text-xs text-muted-foreground mb-1">
              {isSender ? session?.user?.name : sender?.name}
            </span>
            
            {/* 消息气泡 */}
            <div
              className={`rounded-lg px-4 py-2 ${
                isSender
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted text-muted-foreground rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              
              {/* 时间戳 */}
              <span className={`text-xs mt-1 block ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: zhCN })}
              </span>
            </div>
            
            {/* 已读状态 */}
            {isSender && message.isRead && (
              <span className="text-xs text-muted-foreground mt-1">
                已读
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // 清空聊天记录
  const clearChatHistory = async () => {
    try {
      setIsClearing(true);
      
      const response = await fetch(`/api/messages/clear?userId=${params.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '清空聊天记录失败');
      }
      
      // 清空本地消息
      setMessages([]);
      toast.success('聊天记录已清空');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('清空聊天记录时出错:', error);
      toast.error(error.message || '清空聊天记录失败');
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between py-4 border-b">
        <div className="flex items-center gap-2">
          <Link
            href="/messages"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">
            {sender ? `与 ${sender.name} 的对话` : '消息详情'}
          </h1>
        </div>
        
        {/* 操作按钮 */}
        {sender && messages.length > 0 && (
          <div className="relative">
            <button 
              onClick={() => setShowConfirmModal(true)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="清空聊天记录"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {retrying ? '重试中...' : '重试'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 消息列表 */}
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无消息记录
              </div>
            ) : (
              <>
                {messages.map(renderMessageBubble)}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* 发送消息表单 */}
          {sender && (
            <div className="mt-8 sticky bottom-0 bg-background pb-4 pt-2">
              <SendMessageForm
                recipientId={params.id}
                recipientName={sender.name}
                onSuccess={handleSendSuccess}
                sendMessage={sendMessage}
                className="max-w-2xl mx-auto"
              />
            </div>
          )}
          
          {/* 连接状态提示 */}
          {!isConnected && (
            <div className="fixed bottom-4 right-4 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 z-50">
              <span className="animate-pulse relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive-foreground"></span>
              </span>
              消息服务已断开
            </div>
          )}
        </div>
      )}
      
      {/* 清空聊天记录确认弹窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">清空聊天记录</h3>
            <p className="mb-6 text-muted-foreground">您确定要清空与 {sender?.name} 的所有聊天记录吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent/50 transition-colors"
                disabled={isClearing}
              >
                取消
              </button>
              <button
                onClick={clearChatHistory}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors flex items-center"
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    处理中...
                  </>
                ) : '确认清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDetailPage; 