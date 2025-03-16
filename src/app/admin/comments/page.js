"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash, 
  RefreshCw,
  Filter,
  Calendar,
  User,
  FileText,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CornerUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function CommentsManagement() {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [commentToReply, setCommentToReply] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 构建查询参数
      const params = new URLSearchParams({
        page,
        search: searchTerm,
        filter,
        sortField,
        sortDirection
      });
      
      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotalPages(data.totalPages);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取评论列表失败');
      }
    } catch (error) {
      console.error('获取评论列表出错:', error);
      setError('获取评论列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchComments();
  }, []);

  // 当搜索条件、分页、排序、筛选等变化时重新获取数据
  useEffect(() => {
    fetchComments();
  }, [page, searchTerm, filter, sortField, sortDirection]);

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);  // 重置页码
  };

  // 处理排序
  const handleSort = (field) => {
    if (sortField === field) {
      // 切换排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 切换排序字段，默认降序
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);  // 重置页码
  };

  // 处理删除
  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteModal(true);
  };

  // 执行删除操作
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/comments?id=${commentToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 删除成功，更新评论列表
        setComments(comments.filter(comment => comment.id !== commentToDelete.id));
        setShowDeleteModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除评论失败');
      }
    } catch (error) {
      console.error('删除评论出错:', error);
      setError(error.message || '删除评论时发生错误');
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  };

  // 处理回复
  const handleReplyClick = (comment) => {
    setCommentToReply(comment);
    setReplyContent('');
    setShowReplyModal(true);
  };

  // 执行回复操作
  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      return;
    }
    
    try {
      setIsReplying(true);
      
      const response = await fetch('/api/admin/comments/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId: commentToReply.id,
          postId: commentToReply.postId,
          content: replyContent
        })
      });
      
      if (response.ok) {
        // 回复成功，更新评论列表
        fetchComments();
        setShowReplyModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '回复评论失败');
      }
    } catch (error) {
      console.error('回复评论出错:', error);
      setError(error.message || '回复评论时发生错误');
    } finally {
      setIsReplying(false);
      setCommentToReply(null);
    }
  };

  // 审核评论（批准）
  const handleApprove = async (commentId) => {
    try {
      setIsApproving(true);
      
      const response = await fetch(`/api/admin/comments/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: commentId,
          status: 'approved'
        })
      });
      
      if (response.ok) {
        // 更新评论状态
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, status: 'approved' } 
            : comment
        ));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '批准评论失败');
      }
    } catch (error) {
      console.error('批准评论出错:', error);
      setError(error.message || '批准评论时发生错误');
    } finally {
      setIsApproving(false);
    }
  };

  // 审核评论（拒绝）
  const handleReject = async (commentId) => {
    try {
      setIsRejecting(true);
      
      const response = await fetch(`/api/admin/comments/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: commentId,
          status: 'rejected'
        })
      });
      
      if (response.ok) {
        // 更新评论状态
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, status: 'rejected' } 
            : comment
        ));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '拒绝评论失败');
      }
    } catch (error) {
      console.error('拒绝评论出错:', error);
      setError(error.message || '拒绝评论时发生错误');
    } finally {
      setIsRejecting(false);
    }
  };

  // 格式化评论内容（截断长评论）
  const formatContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  // 获取评论状态标签
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle size={12} className="mr-1" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            已批准
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            已拒绝
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">评论管理</h1>
      </div>

      {/* 筛选与搜索 */}
      <div className="bg-card rounded-xl border border-border/50 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="搜索评论内容或作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
              />
            </div>
            <button 
              type="submit"
              className="ml-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              搜索
            </button>
          </form>

          {/* 状态筛选 */}
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="flex-grow px-4 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">全部评论</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
              <option value="flagged">被举报</option>
            </select>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <XCircle size={18} />
            {error}
          </p>
          <button 
            onClick={fetchComments}
            className="mt-2 flex items-center gap-1 text-sm hover:underline"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      {/* 评论列表 */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">评论内容</th>
                <th className="px-4 py-3 text-left">作者</th>
                <th className="px-4 py-3 text-left">文章</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3 text-center">发布时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2" size={20} />
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-muted-foreground">
                    没有找到符合条件的评论
                  </td>
                </tr>
              ) : (
                comments.map(comment => (
                  <tr key={comment.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <p className="text-sm">
                          {formatContent(comment.content)}
                        </p>
                        {comment.parentId && (
                          <div className="mt-1 text-xs text-muted-foreground flex items-center">
                            <CornerUpRight size={12} className="mr-1" />
                            回复评论
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {comment.author?.image && (
                          <img 
                            src={comment.author.image} 
                            alt={comment.author.name} 
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">{comment.author?.name || '未知用户'}</div>
                          <div className="text-xs text-muted-foreground">{comment.author?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link 
                        href={`/posts/${comment.postId}`}
                        className="text-primary hover:underline flex items-center text-sm"
                      >
                        <FileText size={14} className="mr-1" />
                        {comment.post?.title 
                          ? (comment.post.title.length > 25 
                              ? comment.post.title.substring(0, 25) + '...' 
                              : comment.post.title)
                          : '未知文章'
                        }
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(comment.status || 'approved')}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Calendar size={14} className="mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        {comment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(comment.id)}
                              className="p-1.5 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20 transition-colors"
                              title="批准评论"
                              disabled={isApproving}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(comment.id)}
                              className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                              title="拒绝评论"
                              disabled={isRejecting}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleReplyClick(comment)}
                          className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors"
                          title="回复评论"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <Link 
                          href={`/posts/${comment.postId}#comment-${comment.id}`}
                          className="p-1.5 bg-purple-500/10 text-purple-500 rounded-md hover:bg-purple-500/20 transition-colors"
                          title="查看评论"
                          target="_blank"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(comment)}
                          className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                          title="删除评论"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              共 <span className="font-medium">{totalPages}</span> 页
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-md ${
                  page === 1 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-accent text-accent-foreground hover:bg-accent/80'
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded-md ${
                    page === i + 1
                      ? 'bg-primary text-white'
                      : 'bg-accent text-accent-foreground hover:bg-accent/80'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded-md ${
                  page === totalPages 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-accent text-accent-foreground hover:bg-accent/80'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">确认删除</h3>
            <p className="mb-6">
              您确定要删除此评论吗？此操作不可逆。
              <div className="mt-3 p-3 bg-muted/30 rounded-md text-sm">
                "{commentToDelete?.content}"
              </div>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash size={16} className="mr-2" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回复对话框 */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">回复评论</h3>
            <div className="mb-4 p-3 bg-muted/30 rounded-md text-sm">
              <div className="flex items-start gap-2 mb-2">
                <div className="mt-1">
                  <User size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{commentToReply?.author?.name || '未知用户'}</div>
                  <div>{commentToReply?.content}</div>
                </div>
              </div>
            </div>
            <form onSubmit={handleReply}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="replyContent">
                  回复内容
                </label>
                <textarea
                  id="replyContent"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
                  placeholder="输入回复内容..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                  disabled={isReplying}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center"
                  disabled={isReplying || !replyContent.trim()}
                >
                  {isReplying ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      提交中...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={16} className="mr-2" />
                      发表回复
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 