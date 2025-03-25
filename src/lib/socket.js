import { Server } from 'socket.io';

// 存储所有在线用户的socket连接
export const connectedUsers = new Map();

let io;

export function getIO() {
  return io;
}

export function initSocketServer(server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // 用户登录后认证
    socket.on('authenticate', (userId) => {
      if (userId) {
        // 存储用户的socket连接
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        
        // 加入用户专属房间
        socket.join(`user:${userId}`);
      }
    });
    
    // 发送私信
    socket.on('sendPrivateMessage', async ({ senderId, receiverId, content }) => {
      try {
        // 消息会通过API存储到数据库
        // 这里只负责实时推送
        
        // 推送到接收者
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          socket.to(receiverSocketId).emit('newMessage', {
            senderId,
            content,
            createdAt: new Date(),
            type: 'PRIVATE'
          });
        }
      } catch (error) {
        console.error('Send private message error:', error);
      }
    });
    
    // 标记消息为已读
    socket.on('markAsRead', ({ messageId, receiverId }) => {
      // 通知消息发送者消息已读
      io.to(`user:${receiverId}`).emit('messageRead', { messageId });
    });
    
    // 用户断开连接
    socket.on('disconnect', () => {
      // 从在线用户列表中删除
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

// 发送系统消息
export function sendSystemMessage(userId, message) {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('systemMessage', message);
    return true;
  }
  return false;
}

// 给所有用户发送广播消息
export function broadcastMessage(message) {
  io.emit('broadcast', message);
} 