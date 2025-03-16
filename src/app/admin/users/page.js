"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash, 
  Edit, 
  Loader2,
  UserPlus,
  X,
  Check,
  Shield,
  ShieldX 
} from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users?page=${page}&search=${searchTerm}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表出错:', error);
      setError('获取用户列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和搜索/分页变更时获取用户
  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.search.value;
    setSearchTerm(searchValue);
    setPage(1); // 重置到第一页
  };

  // 显示编辑模态框
  const handleEdit = (user) => {
    setEditUser({
      ...user,
      role: user.role || 'USER'
    });
    setShowModal(true);
  };

  // 保存用户编辑
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    if (!editUser) return;
    
    try {
      setIsSaving(true);
      
      const formData = new FormData(e.target);
      const userData = {
        id: editUser.id,
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        bio: formData.get('bio') || null
      };
      
      // 如果提供了新密码，则包含密码
      const newPassword = formData.get('password');
      if (newPassword) {
        userData.password = newPassword;
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        // 更新成功，刷新用户列表
        await fetchUsers();
        setShowModal(false);
        setEditUser(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '更新用户失败');
      }
    } catch (error) {
      console.error('更新用户出错:', error);
      setError('更新用户时发生错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 处理删除用户
  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/users?id=${confirmDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 删除成功，刷新用户列表
        await fetchUsers();
        setConfirmDelete(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户出错:', error);
      setError('删除用户时发生错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 切换用户角色（快速操作）
  const toggleUserRole = async (user) => {
    try {
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          role: newRole
        }),
      });
      
      if (response.ok) {
        // 更新成功，刷新用户列表
        await fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '更新用户角色失败');
      }
    } catch (error) {
      console.error('更新用户角色出错:', error);
      setError('更新用户角色时发生错误');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">用户管理</h1>
        <button
          onClick={() => {
            setEditUser({
              id: '',
              name: '',
              email: '',
              role: 'USER',
              bio: ''
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={18} />
          <span>新增用户</span>
        </button>
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

      {/* 搜索栏 */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              name="search"
              placeholder="搜索用户名或邮箱..."
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              defaultValue={searchTerm}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            搜索
          </button>
        </form>
      </div>

      {/* 用户列表 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length > 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-accent/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                          alt={user.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {user.role === 'ADMIN' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleUserRole(user)}
                      className={`p-1.5 rounded-md ${
                        user.role === 'ADMIN'
                          ? 'text-purple-500 hover:bg-purple-500/10'
                          : 'text-green-500 hover:bg-green-500/10'
                      }`}
                      title={user.role === 'ADMIN' ? '降级为普通用户' : '提升为管理员'}
                    >
                      {user.role === 'ADMIN' ? <ShieldX size={18} /> : <Shield size={18} />}
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 rounded-md text-blue-500 hover:bg-blue-500/10"
                      title="编辑用户"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(user)}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10"
                      title="删除用户"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border/50 p-12 text-center text-muted-foreground">
          没有找到匹配的用户
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <div className="px-4 py-2 rounded-md border border-border bg-card">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 用户编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50" onClick={() => !isSaving && setShowModal(false)}></div>
            </div>

            <div className="relative inline-block bg-card rounded-lg border border-border text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
                  <h3 className="text-lg font-medium">{editUser.id ? '编辑用户' : '新增用户'}</h3>
                  <button 
                    onClick={() => !isSaving && setShowModal(false)}
                    className="p-1 rounded-full hover:bg-accent/50"
                    disabled={isSaving}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveUser}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        用户名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={editUser.name}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        邮箱 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={editUser.email}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-1">
                        密码 {!editUser.id && <span className="text-red-500">*</span>}
                        {editUser.id && <span className="text-muted-foreground text-xs">(留空表示不修改)</span>}
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                        required={!editUser.id}
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium mb-1">
                        角色
                      </label>
                      <select
                        id="role"
                        name="role"
                        defaultValue={editUser.role}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                      >
                        <option value="USER">普通用户</option>
                        <option value="ADMIN">管理员</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium mb-1">
                        个人简介
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        defaultValue={editUser.bio}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-y min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                      disabled={isSaving}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>保存</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 确认删除模态框 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50" onClick={() => !isSaving && setConfirmDelete(null)}></div>
            </div>

            <div className="relative inline-block bg-card rounded-lg border border-border text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium">删除用户</h3>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        确定要删除用户 "{confirmDelete.name}" 吗？此操作无法撤销，用户的所有数据将被永久删除。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-500 text-base font-medium text-white hover:bg-red-600 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteUser}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      删除中...
                    </>
                  ) : (
                    '删除'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-4 py-2 bg-card text-base font-medium hover:bg-accent transition-colors focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmDelete(null)}
                  disabled={isSaving}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 