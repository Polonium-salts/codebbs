"use client";

import { useState, useEffect } from 'react';
import { 
  Database, 
  Save, 
  Trash2, 
  RefreshCcw, 
  Clock, 
  HardDrive, 
  Table, 
  AlertCircle,
  Loader2,
  CheckCircle,
  Download,
  ArrowUpFromLine,
  X,
  Search,
  ArrowDown,
  ArrowUp,
  Trash
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

// 数据库信息卡片组件
const InfoCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-card rounded-xl shadow-sm p-6 border border-border/50">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <h3 className="text-xl font-bold mt-2">{value}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="p-3 rounded-full bg-primary/10">
        <Icon className="text-primary" size={20} />
      </div>
    </div>
  </div>
);

// 表记录卡片组件
const TableCard = ({ name, count }) => (
  <div className="bg-card rounded-xl shadow-sm p-4 border border-border/50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-xs uppercase">{name}表</p>
        <h4 className="text-lg font-medium mt-1">{count}</h4>
      </div>
      <div className="p-2 rounded-full bg-muted">
        <Table className="text-muted-foreground" size={16} />
      </div>
    </div>
  </div>
);

// 确认模态框组件
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "确认", cancelText = "取消", isDestructive = false }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md text-white transition-colors ${
                isDestructive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 备份列表模态框组件
const BackupsModal = ({ isOpen, onClose, backups, onRestore, onDelete, isLoading }) => {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const filteredBackups = backups.filter(backup => 
    backup.file.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedBackups = [...filteredBackups].sort((a, b) => {
    if (sortField === 'createdAt') {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'size') {
      return sortDirection === 'asc' ? a.size - b.size : b.size - a.size;
    }
    return 0;
  });
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold">数据库备份列表</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Search size={18} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索备份文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedBackups.length > 0 ? (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      备份时间
                      {sortField === 'createdAt' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('size')}
                  >
                    <div className="flex items-center">
                      大小
                      {sortField === 'size' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedBackups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(backup.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {backup.sizeFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onRestore(backup.id)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="还原此备份"
                        >
                          <ArrowUpFromLine size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(backup.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="删除此备份"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              没有找到匹配的备份文件
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-border flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            共 {filteredBackups.length} 个备份文件
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DatabaseManagementPage() {
  const [dbInfo, setDbInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({ type: null, message: null });
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backups, setBackups] = useState([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  // 获取数据库信息
  const fetchDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('正在获取数据库信息...');
      const response = await fetch('/api/admin/database');
      console.log('API响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取到的数据库信息:', data);
        setDbInfo(data);
      } else {
        console.error('API错误响应:', response.status);
        let errorMessage = '获取数据库信息失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('解析错误响应失败:', e);
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('获取数据库信息出错:', error);
      setError('获取数据库信息时发生错误: ' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 获取备份列表
  const fetchBackups = async () => {
    try {
      setIsLoadingBackups(true);
      const response = await fetch('/api/admin/database?backups=true');
      
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        const errorData = await response.json();
        console.error('获取备份列表失败:', errorData.message);
        // 显示错误消息或处理错误
      }
    } catch (error) {
      console.error('获取备份列表出错:', error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // 执行数据库操作
  const executeDbAction = async (action, backupId = null) => {
    try {
      setActionStatus({ type: 'loading', message: '正在执行操作...' });
      
      const payload = { action };
      if (backupId) payload.backupId = backupId;
      
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setActionStatus({ type: 'success', message: data.message });
        // 刷新数据库信息和备份列表
        fetchDatabaseInfo();
        if (backupModalOpen) {
          fetchBackups();
        }
      } else {
        setActionStatus({ type: 'error', message: data.message || '操作失败' });
      }
    } catch (error) {
      console.error('执行数据库操作出错:', error);
      setActionStatus({ type: 'error', message: '执行操作时发生错误' });
    } finally {
      // 5秒后清除状态消息
      setTimeout(() => {
        setActionStatus({ type: null, message: null });
      }, 5000);
    }
  };

  // 打开还原确认模态框
  const confirmRestore = (backupId) => {
    setConfirmModal({
      isOpen: true,
      title: '确认还原数据库',
      message: '还原操作将使用备份文件覆盖当前数据库。此操作不可逆，确认继续吗？',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeDbAction('restore', backupId);
      },
      isDestructive: true
    });
  };

  // 打开删除备份确认模态框
  const confirmDeleteBackup = (backupId) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除备份',
      message: '此操作将永久删除所选备份文件，无法恢复。确认继续吗？',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeDbAction('delete_backup', backupId);
      },
      isDestructive: true
    });
  };

  // 打开备份列表模态框
  const openBackupModal = () => {
    setBackupModalOpen(true);
    fetchBackups();
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">数据库管理</h1>
        <button 
          onClick={fetchDatabaseInfo}
          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          <RefreshCcw size={16} />
          刷新信息
        </button>
      </div>

      {/* 状态消息 */}
      {actionStatus.message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${actionStatus.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/30' : actionStatus.type === 'error' ? 'bg-red-500/10 text-red-600 border border-red-500/30' : 'bg-blue-500/10 text-blue-600 border border-blue-500/30'}`}>
          {actionStatus.type === 'loading' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : actionStatus.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <p>{actionStatus.message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600">
          <p className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : dbInfo ? (
        <>
          {/* 数据库概览 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">数据库概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard 
                title="数据库大小" 
                value={dbInfo.dbSizeFormatted} 
                icon={HardDrive} 
                description={`位置: ${dbInfo.dbPath}`}
              />
              <InfoCard 
                title="数据表总数" 
                value={Object.keys(dbInfo.tables).length} 
                icon={Database} 
              />
              <InfoCard 
                title="备份信息" 
                value={dbInfo.backupsCount ? `${dbInfo.backupsCount} 个备份` : "暂无备份"} 
                icon={Clock} 
                description={dbInfo.lastBackup ? `最近备份: ${new Date(dbInfo.lastBackup.createdAt).toLocaleString()}` : "建议定期备份数据库"}
              />
            </div>
          </div>

          {/* 数据表统计 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">数据表记录统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dbInfo.tables).map(([tableName, count]) => (
                <TableCard key={tableName} name={tableName} count={count} />
              ))}
            </div>
          </div>

          {/* 数据库操作 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">数据库操作</h2>
            <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-border rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Save className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">备份数据库</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        创建当前数据库的完整备份。备份文件将保存在 '/backups' 目录下。
                      </p>
                      <button
                        onClick={() => executeDbAction('backup')}
                        className="mt-4 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <RefreshCcw className="text-green-500" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">优化数据库</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        执行VACUUM操作，压缩数据库文件并优化性能。此操作可能需要一些时间。
                      </p>
                      <button
                        onClick={() => executeDbAction('vacuum')}
                        className="mt-4 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        <RefreshCcw size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/10">
                      <ArrowUpFromLine className="text-yellow-500" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">还原数据库</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        从以前的备份恢复数据库。此操作将覆盖当前数据库，请谨慎使用。
                      </p>
                      <button
                        onClick={openBackupModal}
                        className="mt-4 flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                        disabled={!dbInfo.backupsCount}
                      >
                        <ArrowUpFromLine size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">注意事项</h4>
                    <p className="mt-1 text-sm">
                      进行数据库操作前，请确保没有重要的进行中操作。特别是还原操作将完全覆盖当前数据，此操作不可逆。建议在系统负载较低时执行优化和还原操作。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 备份列表模态框 */}
          <BackupsModal 
            isOpen={backupModalOpen}
            onClose={() => setBackupModalOpen(false)}
            backups={backups}
            onRestore={confirmRestore}
            onDelete={confirmDeleteBackup}
            isLoading={isLoadingBackups}
          />
          
          {/* 确认模态框 */}
          <ConfirmModal 
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            isDestructive={confirmModal.isDestructive}
          />
        </>
      ) : (
        <div className="bg-card rounded-xl shadow-sm p-8 text-center border border-border/50">
          <div className="text-muted-foreground mb-4">无法加载数据库信息</div>
          <button
            onClick={fetchDatabaseInfo}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
} 