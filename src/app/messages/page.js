'use client';

import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Tabs } from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSocket } from '@/lib/socketClient';

const MessagePage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [expandedSystemMessages, setExpandedSystemMessages] = useState(false);
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
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
      
      const response = await fetch(`/api/messages?type=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('获取消息失败');
      }
      
      const data = await response.json();
      setMessages(data.messages);
      setUnreadCount(data.unreadCount);
      
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
      
      // 更新未读数量
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('已标记为已读');
      
    } catch (err) {
      console.error('标记已读时出错:', err);
      toast.error('标记已读失败');
    }
  };
  
  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      });
      
      if (!response.ok) {
        throw new Error('标记所有已读失败');
      }
      
      // 更新所有消息为已读
      setMessages(messages.map(msg => ({ ...msg, isRead: true })));
      setUnreadCount(0);
      toast.success('已将所有消息标记为已读');
      
    } catch (err) {
      console.error('标记所有已读时出错:', err);
      toast.error('标记所有已读失败');
    }
  };
  
  // 切换标签时重新获取消息
  useEffect(() => {
    fetchMessages();
  }, [activeTab]);
  
  // 处理标签切换
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // 格式化时间
  const formatTime = (dateString) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN
    });
  };
  
  // 处理系统消息展开/收起
  const handleSystemMessagesToggle = () => {
    setExpandedSystemMessages(!expandedSystemMessages);
  };
  
  // 获取分组后的消息列表
  const getGroupedMessages = () => {
    if (!messages || messages.length === 0) return [];
    
    const messagesBySender = {};
    const systemMessages = { id: 'system', type: 'SYSTEM', messages: [] };
    
    // 按发送者分组消息
    messages.forEach(msg => {
      if (msg.type === 'SYSTEM') {
        systemMessages.messages.push(msg);
        return;
      }
      
      const senderId = msg.sender?.id || 'unknown';
      if (!messagesBySender[senderId]) {
        messagesBySender[senderId] = {
          id: senderId,
          name: msg.sender?.name || '未知用户',
          avatar: msg.sender?.image || null,
          messages: [],
          hasUnread: false
        };
      }
      
      messagesBySender[senderId].messages.push(msg);
      if (!msg.isRead) {
        messagesBySender[senderId].hasUnread = true;
      }
    });
    
    // 获取每个发送者的最新消息
    const result = Object.values(messagesBySender).map(sender => {
      // 按时间排序消息
      sender.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // 计算未读消息数量
      const unreadCount = sender.messages.filter(msg => !msg.isRead).length;
      
      return {
        ...sender,
        latestMessage: sender.messages[0],
        unreadCount,
      };
    });
    
    // 处理系统消息
    if (systemMessages.messages.length > 0) {
      systemMessages.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const unreadCount = systemMessages.messages.filter(msg => !msg.isRead).length;
      
      result.unshift({
        id: 'system',
        name: '系统消息',
        avatar: null,
        latestMessage: systemMessages.messages[0],
        messages: systemMessages.messages,
        hasUnread: unreadCount > 0,
        unreadCount,
      });
    }
    
    // 按最新消息时间排序
    return result.sort((a, b) => 
      new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt)
    );
  };
  
  // 渲染系统消息列表
  const renderSystemMessages = (messages) => {
    return (
      <div className="space-y-4 mt-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg border ${
              !message.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card border-border/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <span className="font-medium">系统消息</span>
                {!message.isRead && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    新消息
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.createdAt)}
              </span>
            </div>
            <p className="text-sm text-foreground">{message.content}</p>
            {!message.isRead && (
              <button
                onClick={() => markAsRead(message.id)}
                className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                标为已读
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // 获取头像
  const getAvatar = (sender) => {
    if (sender.id === 'system') {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
      );
    } else if (sender.avatar) {
      return (
        <img 
          src={sender.avatar} 
          alt={sender.name} 
          className="w-12 h-12 rounded-full object-cover border border-border/30"
        />
      );
    } else {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/50 text-accent-foreground border border-border/30">
          <span className="text-lg font-semibold">
            {sender.name?.[0] || '?'}
          </span>
        </div>
      );
    }
  };
  
  // 获取分组后的消息列表
  const groupedMessages = getGroupedMessages();
  
  // 处理实时消息通知
  useEffect(() => {
    if (!socket) return;
    
    // 监听新消息
    const handleNewMessage = (message) => {
      // 检查是否已存在该消息（防止重复）
      if (messages.some(m => m.id === message.id)) return;
      
      // 添加新消息
      setMessages(prev => [message, ...prev]);
      
      // 更新未读消息计数
      setUnreadCount(prev => prev + 1);
      
      // 显示通知
      toast.success(`收到来自 ${message.sender?.name || '系统'} 的新消息`);
    };
    
    // 监听已读消息通知
    const handleMessageRead = ({ messageId }) => {
      // 更新消息状态
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, isRead: true } : msg)
      );
    };
    
    // 注册事件监听
    socket.on('newMessage', handleNewMessage);
    socket.on('systemMessage', handleNewMessage);
    socket.on('messageRead', handleMessageRead);
    
    return () => {
      // 清理事件监听
      socket.off('newMessage', handleNewMessage);
      socket.off('systemMessage', handleNewMessage);
      socket.off('messageRead', handleMessageRead);
    };
  }, [socket, messages]);
  
  // 显示连接状态
  useEffect(() => {
    if (isConnected === false) {
      toast.error('消息服务连接已断开，将尝试重新连接');
    }
  }, [isConnected]);
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">消息中心</h1>
        <p className="text-muted-foreground">
          查看您的聊天记录和系统通知
        </p>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <Tabs 
          activeTab={activeTab} 
          onChange={handleTabChange}
          tabs={[
            { id: 'all', label: '全部' },
            { id: 'private', label: '私信' },
            { id: 'system', label: '系统消息' },
          ]}
        />
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center text-sm text-primary hover:text-primary/80 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            全部标为已读 ({unreadCount})
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-card/50 rounded-lg border border-border/30">
          <Spinner className="w-8 h-8 mb-2" />
          <p className="text-muted-foreground">正在加载消息...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-destructive/5 rounded-lg border border-destructive/20">
          <div className="mx-auto w-16 h-16 mb-4 text-destructive">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-destructive mb-1">获取消息失败</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center mx-auto"
          >
            {retrying ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                重试中...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                重新加载
              </>
            )}
          </button>
        </div>
      ) : groupedMessages.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border/50">
          <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground">暂无消息</h3>
          <p className="mt-1 text-muted-foreground">您当前没有任何消息</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {groupedMessages.map((sender) => (
            <div key={sender.id}>
              {sender.id === 'system' ? (
                <div className="p-4 border-b border-border/50 last:border-b-0 bg-card">
                  <button
                    onClick={handleSystemMessagesToggle}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <div className="ml-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">系统消息</span>
                          {sender.unreadCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-500 text-white text-xs font-medium px-2 py-0.5">
                              {sender.unreadCount > 99 ? '99+' : sender.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {sender.latestMessage.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(sender.latestMessage.createdAt)}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-4 h-4 transition-transform ${
                          expandedSystemMessages ? 'rotate-180' : ''
                        }`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>
                  {expandedSystemMessages && renderSystemMessages(sender.messages)}
                </div>
              ) : (
                <Link
                  href={`/messages/${sender.id}`}
                  className={`flex items-center p-4 border-b border-border/50 last:border-b-0 transition-colors hover:bg-accent/5 ${
                    sender.hasUnread ? 'bg-primary/5' : 'bg-card'
                  }`}
                >
                  {/* 头像 */}
                  <div className="relative">
                    {getAvatar(sender)}
                    {sender.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                        {sender.unreadCount > 99 ? '99+' : sender.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* 中间内容区 */}
                  <div className="flex-1 ml-3 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`font-medium truncate ${sender.hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {sender.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatTime(sender.latestMessage.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${sender.hasUnread ? 'text-foreground font-normal' : 'text-muted-foreground'}`}>
                      {sender.latestMessage.content}
                    </p>
                  </div>
                  
                  {/* 右侧箭头 */}
                  <div className="ml-2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      
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
  );
};

export default MessagePage; 