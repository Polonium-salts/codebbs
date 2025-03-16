"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Tag, 
  ThumbsUp, 
  Bookmark,
  TrendingUp,
  Calendar,
  Loader2
} from 'lucide-react';

// 数据卡片组件
const StatCard = ({ title, value, icon: Icon, color, isLoading }) => (
  <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <h3 className="text-2xl font-bold mt-2">
          {isLoading ? (
            <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
          ) : (
            value || 0
          )}
        </h3>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={color} size={20} />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 获取网站统计数据
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/stats');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || '获取统计数据失败');
        }
      } catch (error) {
        console.error('获取统计数据出错:', error);
        setError('获取统计数据时发生错误');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">控制台</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* 站点数据概览 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">站点数据概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="用户总数" 
            value={stats?.userCount} 
            icon={Users} 
            color="text-blue-500"
            isLoading={isLoading}
          />
          <StatCard 
            title="文章总数" 
            value={stats?.postCount} 
            icon={FileText} 
            color="text-green-500"
            isLoading={isLoading}
          />
          <StatCard 
            title="评论总数" 
            value={stats?.commentCount} 
            icon={MessageSquare} 
            color="text-yellow-500"
            isLoading={isLoading}
          />
          <StatCard 
            title="分类总数" 
            value={stats?.categoryCount} 
            icon={Tag} 
            color="text-purple-500"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 交互数据 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">交互数据</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="点赞总数" 
            value={stats?.likeCount} 
            icon={ThumbsUp} 
            color="text-red-500"
            isLoading={isLoading}
          />
          <StatCard 
            title="收藏总数" 
            value={stats?.bookmarkCount} 
            icon={Bookmark} 
            color="text-orange-500"
            isLoading={isLoading}
          />
          <StatCard 
            title="关注总数" 
            value={stats?.followCount} 
            icon={TrendingUp} 
            color="text-teal-500"
            isLoading={isLoading}
          />
          <StatCard 
            title="总浏览量" 
            value={stats?.totalViews} 
            icon={TrendingUp} 
            color="text-indigo-500"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 最近活动 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">最近活动</h2>
        {isLoading ? (
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6">
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        ) : stats?.recentActivities?.length > 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentActivities.map((activity, index) => (
                  <tr key={index} className="hover:bg-accent/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {activity.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {activity.user}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="truncate max-w-xs">{activity.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(activity.time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 text-center text-muted-foreground">
            暂无最近活动
          </div>
        )}
      </div>
    </div>
  );
} 