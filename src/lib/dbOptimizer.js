import prisma from './prisma';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 数据库优化器 - 提供方法来优化SQLite数据库性能
 */
export const dbOptimizer = {
  /**
   * 执行数据库VACUUM操作，重建数据库，减少文件大小
   * 这个操作可能很耗时，建议在低负载时执行
   */
  async vacuum() {
    try {
      await prisma.$executeRawUnsafe('VACUUM;');
      return { success: true, message: '数据库压缩成功' };
    } catch (error) {
      console.error('执行VACUUM时出错:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 优化数据库索引
   * 分析数据库使用情况并添加/删除索引以提高性能
   */
  async optimizeIndexes() {
    try {
      // 获取现有索引
      const indexes = await prisma.$queryRaw`
        SELECT name, tbl_name FROM sqlite_master 
        WHERE type = 'index';
      `;
      
      // 在这里可以添加根据数据库使用分析的索引优化逻辑
      // 例如为经常查询的字段添加索引
      console.log('当前索引:', indexes);
      
      return { success: true, message: '索引分析完成', indexes };
    } catch (error) {
      console.error('优化索引时出错:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 创建数据库备份
   */
  async createBackup() {
    try {
      const dbPath = path.resolve('./prisma/dev.db');
      if (!fs.existsSync(dbPath)) {
        return { success: false, error: '数据库文件不存在' };
      }
      
      // 创建备份目录
      const backupDir = path.resolve('./backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // 生成备份文件名
      const date = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup-${date}.db`);
      
      // 复制数据库文件
      fs.copyFileSync(dbPath, backupPath);
      
      return {
        success: true,
        message: '数据库备份成功',
        path: backupPath,
        date
      };
    } catch (error) {
      console.error('创建备份时出错:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 分析数据库性能，找出慢查询
   */
  async analyzePerformance() {
    try {
      // 启用SQLite的性能分析
      await prisma.$executeRawUnsafe('PRAGMA analysis_limit=1000;');
      await prisma.$executeRawUnsafe('PRAGMA optimize;');
      
      // 获取数据库统计信息
      const tableStats = await prisma.$queryRaw`
        SELECT name, rootpage, tbl_name 
        FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name;
      `;
      
      return {
        success: true,
        message: '数据库性能分析完成',
        tables: tableStats
      };
    } catch (error) {
      console.error('分析数据库性能时出错:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * 清理过期数据和无用记录
   * 定期清理可以提高性能并减少数据库大小
   */
  async cleanupData(daysOld = 90) {
    try {
      // 获取截止日期
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // 清理过期的会话数据
      const sessionsDeleted = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: cutoffDate
          }
        }
      });
      
      // 清理软删除但未硬删除的记录（如果您的模型支持软删除）
      // 例如:
      // const postsDeleted = await prisma.post.deleteMany({
      //   where: {
      //     deleted: true,
      //     updatedAt: {
      //       lt: cutoffDate
      //     }
      //   }
      // });
      
      return {
        success: true,
        message: '数据库清理成功',
        details: {
          sessionsDeleted: sessionsDeleted.count,
          // postsDeleted: postsDeleted.count
        }
      };
    } catch (error) {
      console.error('清理数据时出错:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * 安排周期性的数据库维护任务
 * 该函数可以在服务器启动时调用
 */
export function scheduleDbMaintenance() {
  // 每周日凌晨3点执行VACUUM
  const vacuumInterval = setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 0 && now.getHours() === 3 && now.getMinutes() < 5) {
      console.log('执行周期性数据库维护...');
      await dbOptimizer.vacuum();
      await dbOptimizer.cleanupData();
    }
  }, 300000); // 检查间隔5分钟
  
  return vacuumInterval;
} 