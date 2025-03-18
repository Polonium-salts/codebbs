'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function UserList({ users }) {
  const { data: session } = useSession();
  const [followStates, setFollowStates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // 获取关注状态
  useEffect(() => {
    if (session?.user && users.length > 0) {
      const fetchFollowStates = async () => {
        try {
          const userIds = users.map(user => user.id);
          const response = await fetch(`/api/users/follow-status?userIds=${userIds.join(',')}`);
          
          if (response.ok) {
            const data = await response.json();
            setFollowStates(data.followStates);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('获取关注状态失败:', error);
          setIsLoading(false);
        }
      };
      
      fetchFollowStates();
    }
  }, [session, users]);
  
  const handleFollow = async (userId) => {
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: userId }),
      });
      
      if (response.ok) {
        setFollowStates(prev => ({
          ...prev,
          [userId]: !prev[userId]
        }));
      }
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };
  
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无用户
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Link href={`/users/${user.id}`} className="flex items-center space-x-4">
            <div className="relative w-12 h-12">
              <Image
                src={user.image || '/images/default-avatar.png'}
                alt={user.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.bio || '这个用户很懒，还没有写简介'}</p>
              <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                <span>{user._count.followers} 粉丝</span>
                <span>{user._count.following} 关注</span>
                <span>{user._count.posts} 文章</span>
              </div>
            </div>
          </Link>
          
          {session?.user?.id !== user.id && (
            <button
              onClick={() => handleFollow(user.id)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                isLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : followStates[user.id]
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLoading ? '加载中...' : (followStates[user.id] ? '取消关注' : '关注')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
} 