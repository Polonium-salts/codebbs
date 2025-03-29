import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

/**
 * 插件管理器 - 负责所有插件的管理，提供统一的插件API接口
 */
export class PluginManager {
  static instance = null;
  
  constructor() {
    this.initialized = false;
    this.plugins = new Map(); // 名称 -> 插件实例
    this.hooks = {}; // 钩子名称 -> 处理函数数组
  }
  
  /**
   * 获取插件管理器单例实例
   * @returns {PluginManager} 插件管理器实例
   */
  static getInstance() {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
  
  /**
   * 初始化插件系统
   * 加载所有启用的插件
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('插件系统已经初始化');
      return;
    }
    
    try {
      console.log('开始初始化插件系统...');
      
      // 获取所有启用的插件
      const enabledPlugins = await prisma.plugin.findMany({
        where: { enabled: true }
      });
      
      console.log(`找到 ${enabledPlugins.length} 个启用的插件`);
      
      // 加载每个插件
      for (const plugin of enabledPlugins) {
        await this.loadPlugin(plugin);
      }
      
      this.initialized = true;
      console.log('插件系统初始化完成');
    } catch (error) {
      console.error('初始化插件系统失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载单个插件
   * @param {Object} plugin 插件对象
   * @returns {Promise<boolean>} 是否成功加载
   */
  async loadPlugin(plugin) {
    if (this.plugins.has(plugin.name)) {
      console.log(`插件 ${plugin.name} 已经加载，将先卸载`);
      await this.unloadPlugin(plugin.name);
    }
    
    try {
      console.log(`开始加载插件: ${plugin.name}...`);
      
      // 构建插件路径
      const pluginDir = path.join(process.cwd(), 'plugins', plugin.name);
      const mainFile = path.join(pluginDir, plugin.main);
      
      try {
        // 动态导入插件模块 - 使用相对路径而不是 file:// 协议
        // 对于 Node.js 环境，直接使用路径导入而不是 file:// URL
        const pluginModule = await import(mainFile);
        const pluginExport = pluginModule.default || pluginModule;
        
        if (!pluginExport || typeof pluginExport.initialize !== 'function') {
          console.error(`插件 ${plugin.name} 缺少必要的 initialize 方法`);
          return false;
        }
        
        // 解析插件配置
        const config = plugin.config ? JSON.parse(plugin.config) : {};
        
        // 创建插件上下文
        const context = {
          plugin: {
            name: plugin.name,
            displayName: plugin.displayName,
            version: plugin.version
          },
          hooks: this.hooks,
          registerHook: this.registerHook.bind(this)
        };
        
        // 初始化插件
        await pluginExport.initialize(config, context);
        
        // 注册插件
        this.plugins.set(plugin.name, {
          instance: pluginExport,
          config,
          metadata: plugin
        });
        
        // 注册钩子
        if (plugin.hooks) {
          const hooks = JSON.parse(plugin.hooks);
          
          for (const [hookName, methodName] of Object.entries(hooks)) {
            if (typeof pluginExport[methodName] === 'function') {
              this.registerHook(hookName, plugin.name, pluginExport[methodName].bind(pluginExport));
            } else {
              console.warn(`插件 ${plugin.name} 声明了钩子 ${hookName}，但方法 ${methodName} 不存在`);
            }
          }
        }
        
        console.log(`插件 ${plugin.name} 加载成功`);
        return true;
      } catch (error) {
        console.error(`加载插件 ${plugin.name} 失败:`, error);
        return false;
      }
    } catch (error) {
      console.error(`加载插件 ${plugin.name} 过程中出现错误:`, error);
      return false;
    }
  }
  
  /**
   * 卸载插件
   * @param {string} pluginName 插件名称
   * @returns {Promise<boolean>} 是否成功卸载
   */
  async unloadPlugin(pluginName) {
    if (!this.plugins.has(pluginName)) {
      console.log(`插件 ${pluginName} 未加载，无需卸载`);
      return true;
    }
    
    try {
      console.log(`开始卸载插件: ${pluginName}...`);
      
      const { instance } = this.plugins.get(pluginName);
      
      // 调用插件销毁方法
      if (instance && typeof instance.destroy === 'function') {
        await instance.destroy();
      }
      
      // 移除所有该插件注册的钩子
      for (const hookName in this.hooks) {
        this.hooks[hookName] = this.hooks[hookName].filter(
          hook => hook.pluginName !== pluginName
        );
        
        // 如果钩子没有处理函数了，删除该钩子
        if (this.hooks[hookName].length === 0) {
          delete this.hooks[hookName];
        }
      }
      
      // 从已加载插件列表中移除
      this.plugins.delete(pluginName);
      
      console.log(`插件 ${pluginName} 卸载成功`);
      return true;
    } catch (error) {
      console.error(`卸载插件 ${pluginName} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 注册钩子
   * @param {string} hookName 钩子名称
   * @param {string} pluginName 插件名称
   * @param {Function} handler 处理函数
   */
  registerHook(hookName, pluginName, handler) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    
    this.hooks[hookName].push({
      pluginName,
      handler
    });
    
    console.log(`插件 ${pluginName} 注册了钩子 ${hookName}`);
  }
  
  /**
   * 应用钩子
   * @param {string} hookName 钩子名称
   * @param {Object} context 上下文对象
   * @returns {Promise<Object>} 修改后的上下文对象
   */
  async applyHook(hookName, context = {}) {
    if (!this.hooks[hookName] || this.hooks[hookName].length === 0) {
      return context;
    }
    
    let currentContext = { ...context };
    
    for (const hook of this.hooks[hookName]) {
      try {
        currentContext = await hook.handler(currentContext) || currentContext;
      } catch (error) {
        console.error(`执行插件 ${hook.pluginName} 的钩子 ${hookName} 时出错:`, error);
      }
    }
    
    return currentContext;
  }
  
  /**
   * 获取已加载的插件列表
   * @returns {Array} 插件列表
   */
  getLoadedPlugins() {
    const result = [];
    
    for (const [name, { instance, metadata }] of this.plugins.entries()) {
      result.push({
        name,
        displayName: metadata.displayName,
        version: metadata.version,
        enabled: metadata.enabled,
        description: metadata.description,
        author: metadata.author
      });
    }
    
    return result;
  }
  
  /**
   * 获取已注册的钩子列表
   * @returns {Object} 钩子名称 -> 插件名称数组
   */
  getRegisteredHooks() {
    const result = {};
    
    for (const hookName in this.hooks) {
      result[hookName] = this.hooks[hookName].map(hook => hook.pluginName);
    }
    
    return result;
  }
}

// 导出单例
const pluginManager = PluginManager.getInstance();
export default pluginManager; 