'use client';

import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Socket客户端实例
let socket;

// 创建上下文
const SocketContext = createContext(null);

// 获取Socket工具函数，用于非React组件
export function getSocket() {
  return socket;
}

// Socket提供者组件
export function SocketProvider({ children }) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 初始化socket连接
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
      socket = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        withCredentials: true,
      });
    }

    function onConnect() {
      console.log('Socket connected');
      setIsConnected(true);
      
      // 如果用户已登录，进行认证
      if (session?.user?.id) {
        socket.emit('authenticate', session.user.id);
      }
    }

    function onDisconnect() {
      console.log('Socket disconnected');
      setIsConnected(false);
    }

    function onError(error) {
      console.error('Socket error:', error);
      toast.error('消息服务连接失败，请刷新页面重试');
    }

    // 注册事件监听
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    // 如果用户登录状态变化，重新认证
    if (session?.user?.id && isConnected) {
      socket.emit('authenticate', session.user.id);
    }

    return () => {
      // 清理事件监听
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, [session]);

  // 提供Socket实例和连接状态
  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// 使用Socket的自定义Hook
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
} 