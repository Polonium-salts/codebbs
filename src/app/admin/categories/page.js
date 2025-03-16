"use client";

import { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash, 
  File, 
  Save,
  X,
  Loader2,
  RefreshCw 
} from 'lucide-react';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/categories');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '获取分类列表失败');
      }
    } catch (error) {
      console.error('获取分类列表出错:', error);
      setError('获取分类列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchCategories();
  }, []);

  // 添加分类
  const handleAddClick = () => {
    setFormData({ name: '', description: '' });
    setEditCategory(null);
    setShowModal(true);
  };

  // 编辑分类
  const handleEditClick = (category) => {
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditCategory(category);
    setShowModal(true);
  };

  // 删除分类确认
  const handleDeleteClick = (category) => {
    setConfirmDelete(category);
  };

  // 表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 保存分类
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editCategory?.id,
          ...formData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // 更新分类列表
        if (editCategory) {
          setCategories(categories.map(cat => 
            cat.id === editCategory.id ? result.category : cat
          ));
        } else {
          setCategories([...categories, result.category]);
        }
        
        // 关闭弹窗
        setShowModal(false);
        setEditCategory(null);
        setFormData({ name: '', description: '' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存分类失败');
      }
    } catch (error) {
      console.error('保存分类出错:', error);
      setError(error.message || '保存分类时发生错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async () => {
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/admin/categories?id=${confirmDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 删除成功，更新分类列表
        setCategories(categories.filter(cat => cat.id !== confirmDelete.id));
        setConfirmDelete(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除分类失败');
      }
    } catch (error) {
      console.error('删除分类出错:', error);
      setError(error.message || '删除分类时发生错误');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">分类管理</h1>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          <span>新增分类</span>
        </button>
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
            onClick={() => {
              setError(null);
              fetchCategories();
            }}
            className="mt-2 flex items-center gap-1 text-sm hover:underline"
          >
            <RefreshCw size={14} />
            重试
          </button>
        </div>
      )}

      {/* 分类列表 */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin mr-2" size={24} />
            <span>加载中...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Tag size={48} className="mb-4 opacity-20" />
            <p>暂无分类数据</p>
            <button
              onClick={handleAddClick}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span>创建第一个分类</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">分类名称</th>
                  <th className="px-4 py-3 text-left">描述</th>
                  <th className="px-4 py-3 text-center">文章数</th>
                  <th className="px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Tag size={18} className="text-primary" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-muted-foreground line-clamp-1">{category.description || '无描述'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <File size={14} className="text-muted-foreground" />
                        <span>{category._count?.posts || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md hover:bg-amber-500/20 transition-colors"
                          title="编辑分类"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className={`p-1.5 rounded-md transition-colors ${
                            category._count?.posts > 0
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                          }`}
                          title={category._count?.posts > 0 ? '包含文章，不能删除' : '删除分类'}
                          disabled={category._count?.posts > 0}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新增/编辑分类弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editCategory ? '编辑分类' : '新增分类'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="输入分类名称"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1" htmlFor="description">
                  分类描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
                  placeholder="输入分类描述（可选）"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center"
                  disabled={isSaving || !formData.name.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      保存
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">确认删除</h3>
            <p className="mb-6">
              您确定要删除分类 <span className="font-semibold">{confirmDelete.name}</span> 吗？
              此操作不可逆。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleDeleteCategory}
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