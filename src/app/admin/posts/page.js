"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Eye, 
  Edit, 
  Trash, 
  Filter, 
  Calendar, 
  ArrowUp, 
  ArrowDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function PostsManagement() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取文章列表
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 构建查询参数
      const params = new URLSearchParams({
        page,
        search: searchTerm,
        category: selectedCategory,
        status,
        sortField,
        sortDirection
      });
      
      const response = await fetch(`/api/admin/posts?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取文章列表失败');
      }
    } catch (error) {
      console.error('获取文章列表出错:', error);
      setError('获取文章列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('获取分类列表出错:', error);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchCategories();
  }, []);

  // 当搜索条件、分页、排序、筛选等变化时重新获取数据
  useEffect(() => {
    fetchPosts();
  }, [page, searchTerm, selectedCategory, status, sortField, sortDirection]);

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
  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  // 执行删除操作
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/posts?id=${postToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 删除成功，更新文章列表
        setPosts(posts.filter(post => post.id !== postToDelete.id));
        setShowDeleteModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除文章失败');
      }
    } catch (error) {
      console.error('删除文章出错:', error);
      setError(error.message || '删除文章时发生错误');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  // 构建表格列标头
  const renderHeader = (field, label) => (
    <th 
      className="px-4 py-3 cursor-pointer hover:bg-accent/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        )}
      </div>
    </th>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <Link 
          href="/posts/create"
          className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <FileText size={16} />
          <span>新建文章</span>
        </Link>
      </div>

      {/* 筛选与搜索 */}
      <div className="bg-card rounded-xl border border-border/50 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="搜索文章..."
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

          {/* 分类筛选 */}
          <div className="flex items-center">
            <Tag size={18} className="mr-2 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="flex-grow px-4 py-2 border border-border rounded-md bg-background"
            >
              <option value="">全部分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="flex-grow px-4 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
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
            onClick={fetchPosts}
            className="mt-2 flex items-center gap-1 text-sm hover:underline"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      {/* 文章列表 */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {renderHeader('title', '标题')}
                {renderHeader('category', '分类')}
                {renderHeader('author', '作者')}
                {renderHeader('views', '浏览量')}
                {renderHeader('createdAt', '创建时间')}
                {renderHeader('updatedAt', '更新时间')}
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2" size={20} />
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-muted-foreground">
                    没有找到符合条件的文章
                  </td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr key={post.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 max-w-xs">
                        <FileText size={18} className="flex-shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {post.category?.name || '未分类'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {post.author?.image && (
                          <img 
                            src={post.author.image} 
                            alt={post.author.name} 
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <span>{post.author?.name || '未知作者'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {post.views}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-muted-foreground" />
                        <span>
                          {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-muted-foreground" />
                        <span>
                          {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.published ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={14} className="mr-1" />
                          已发布
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-600">
                          <XCircle size={14} className="mr-1" />
                          草稿
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/posts/${post.id}`}
                          className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors"
                          title="查看文章"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/posts/edit/${post.id}`}
                          className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md hover:bg-amber-500/20 transition-colors"
                          title="编辑文章"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(post)}
                          className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                          title="删除文章"
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
              您确定要删除文章 <span className="font-semibold">{postToDelete?.title}</span> 吗？
              此操作不可逆，相关评论也将被删除。
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
    </div>
  );
} 