"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Calendar,
  RefreshCw,
  Loader2,
  Filter
} from 'lucide-react';

// 图表示例组件
const Chart = ({ title, description, data, type = 'bar', isLoading = false }) => {
  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="h-64 bg-muted/40 rounded-md flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-40" />
            <p>这里将渲染{type === 'bar' ? '柱状图' : type === 'line' ? '折线图' : '饼图'}</p>
            <p className="text-xs">(实际项目中集成Chart.js或其他图表库)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/stats?timeRange=${timeRange}`);
      
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

  // 初始加载和时间范围变化时获取数据
  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  // 模拟的图表数据
  const sampleChartData = {
    postsByCategory: [
      { name: '技术', count: 45 },
      { name: '生活', count: 28 },
      { name: '分享', count: 20 },
      { name: '讨论', count: 15 },
      { name: '问答', count: 12 },
    ],
    postsByDate: [
      { date: '2023-01-01', count: 3 },
      { date: '2023-01-02', count: 5 },
      { date: '2023-01-03', count: 2 },
      { date: '2023-01-04', count: 8 },
      { date: '2023-01-05', count: 4 },
      { date: '2023-01-06', count: 6 },
      { date: '2023-01-07', count: 7 },
    ],
    userRegistration: [
      { date: '2023-01-01', count: 12 },
      { date: '2023-01-02', count: 8 },
      { date: '2023-01-03', count: 15 },
      { date: '2023-01-04', count: 7 },
      { date: '2023-01-05', count: 10 },
      { date: '2023-01-06', count: 13 },
      { date: '2023-01-07', count: 16 },
    ]
  };

  // 格式化数字
  const formatNumber = (num) => {
    if (!num) return '0';
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-2 md:mb-0">数据统计</h1>
        
        <div className="flex items-center gap-4">
          {/* 时间筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">时间范围:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-md bg-background text-sm"
            >
              <option value="day">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="year">今年</option>
              <option value="all">全部</option>
            </select>
          </div>
          
          {/* 刷新按钮 */}
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
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
          <button 
            onClick={fetchStats}
            className="mt-2 flex items-center gap-1 text-sm hover:underline"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">总访问量</p>
              <h3 className="text-3xl font-bold mt-2">
                {isLoading ? (
                  <div className="animate-pulse h-9 w-20 bg-muted rounded"></div>
                ) : (
                  formatNumber(stats?.totalViews || 0)
                )}
              </h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                较上周增长 8.3%
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500/10">
              <BarChart3 className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">活跃用户</p>
              <h3 className="text-3xl font-bold mt-2">
                {isLoading ? (
                  <div className="animate-pulse h-9 w-20 bg-muted rounded"></div>
                ) : (
                  formatNumber(stats?.activeUsers || 0)
                )}
              </h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                较上周增长 5.2%
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-500/10">
              <Users className="text-amber-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">新发文章</p>
              <h3 className="text-3xl font-bold mt-2">
                {isLoading ? (
                  <div className="animate-pulse h-9 w-20 bg-muted rounded"></div>
                ) : (
                  formatNumber(stats?.newPosts || 0)
                )}
              </h3>
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1 rotate-180" />
                较上周下降 2.1%
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500/10">
              <FileText className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">互动总数</p>
              <h3 className="text-3xl font-bold mt-2">
                {isLoading ? (
                  <div className="animate-pulse h-9 w-20 bg-muted rounded"></div>
                ) : (
                  formatNumber((stats?.likeCount || 0) + (stats?.commentCount || 0))
                )}
              </h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                较上周增长 12.4%
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500/10">
              <MessageSquare className="text-purple-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Chart 
          title="文章发布趋势" 
          description="按日期统计的文章发布数量" 
          data={sampleChartData.postsByDate}
          type="line"
          isLoading={isLoading}
        />
        <Chart 
          title="用户注册趋势" 
          description="按日期统计的新用户注册数量" 
          data={sampleChartData.userRegistration}
          type="line"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Chart 
          title="文章分类分布" 
          description="各分类下的文章数量统计" 
          data={sampleChartData.postsByCategory}
          type="pie"
          isLoading={isLoading}
        />
        <Chart 
          title="用户活跃度分析" 
          description="按时间段统计的用户活跃情况" 
          data={[]}
          type="bar"
          isLoading={isLoading}
        />
      </div>

      {/* 热门内容 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">热门内容</h2>
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">文章标题</th>
                  <th className="px-4 py-3 text-left">作者</th>
                  <th className="px-4 py-3 text-center">浏览量</th>
                  <th className="px-4 py-3 text-center">点赞</th>
                  <th className="px-4 py-3 text-center">评论</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="animate-pulse h-5 w-48 bg-muted rounded"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="animate-pulse h-5 w-20 bg-muted rounded"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-10 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-10 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-10 bg-muted rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : stats?.popularPosts?.length > 0 ? (
                  stats.popularPosts.map((post, index) => (
                    <tr key={post.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="font-medium text-sm w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
                            {index + 1}
                          </span>
                          <span className="line-clamp-1">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {post.author.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {post.views}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ThumbsUp size={14} className="text-rose-500" />
                          {post._count.likes}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare size={14} className="text-blue-500" />
                          {post._count.comments}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                      没有数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 活跃用户 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">活跃用户</h2>
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">用户</th>
                  <th className="px-4 py-3 text-center">发文数</th>
                  <th className="px-4 py-3 text-center">评论数</th>
                  <th className="px-4 py-3 text-center">获赞数</th>
                  <th className="px-4 py-3 text-center">活跃度</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="animate-pulse h-8 w-8 bg-muted rounded-full mr-2"></div>
                          <div className="animate-pulse h-5 w-32 bg-muted rounded"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-10 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-10 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-10 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="animate-pulse h-5 w-20 bg-muted rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : stats?.activeUsers?.length > 0 ? (
                  stats.activeUsers.map((user, index) => (
                    <tr key={user.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="font-medium text-sm w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
                            {index + 1}
                          </span>
                          <img 
                            src={user.image || 'https://via.placeholder.com/40'} 
                            alt={user.name}
                            className="w-8 h-8 rounded-full mr-2 object-cover" 
                          />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">@{user.email.split('@')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.postCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.commentCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.likesReceived}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-full bg-muted rounded-full h-2 mx-auto max-w-[100px]">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, user.activityScore)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs mt-1">{user.activityScore}%</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                      没有数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 