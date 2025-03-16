import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { PluginManager } from '@/lib/plugin-manager';

const execAsync = promisify(exec);

// 确保插件目录存在
const ensurePluginDirectory = (pluginName) => {
  const pluginsDir = path.join(process.cwd(), 'plugins');
  const pluginDir = path.join(pluginsDir, pluginName);
  
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir);
  }
  
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir);
  }
  
  return pluginDir;
};

// 创建默认插件文件
const createDefaultPluginFile = (pluginDir, main) => {
  const mainFilePath = path.join(pluginDir, main);
  
  if (!fs.existsSync(mainFilePath)) {
    const pluginTemplate = `/**
 * 默认生成的插件模板
 */
module.exports = {
  /**
   * 初始化插件
   * @param {Object} config - 插件配置
   * @param {Object} context - 上下文对象，包含有用的工具和API
   */
  initialize: function(config, context) {
    console.log('插件已初始化，配置:', config);
    return Promise.resolve();
  },
  
  /**
   * 销毁插件
   */
  destroy: function() {
    console.log('插件已销毁');
    return Promise.resolve();
  },
  
  /**
   * 示例方法 - 可以通过 hooks 配置映射到钩子
   */
  onSomeEvent: function(ctx) {
    console.log('钩子事件触发');
    return ctx;
  }
};
`;
    
    fs.writeFileSync(mainFilePath, pluginTemplate);
  }
  
  return mainFilePath;
};

// 递归删除目录及其内容
const deleteDirectory = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // 递归删除子目录
        deleteDirectory(curPath);
      } else {
        // 删除文件
        fs.unlinkSync(curPath);
      }
    });
    
    // 删除目录本身
    fs.rmdirSync(dirPath);
  }
};

// 验证用户是否为管理员
const isAdmin = async (req) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return false;
  }
  
  return session.user.role === 'ADMIN';
};

// 处理 GET 请求 - 获取所有插件
export async function GET(req) {
  try {
    // 验证用户是否为管理员
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取所有插件
    const plugins = await prisma.plugin.findMany();
    
    // 检查插件是否已加载
    const pluginManager = PluginManager.getInstance();
    const loadedPlugins = pluginManager.getLoadedPlugins();
    
    // 增强插件数据
    const enhancedPlugins = plugins.map(plugin => {
      const isLoaded = loadedPlugins.some(lp => lp.name === plugin.name);
      
      return {
        ...plugin,
        isLoaded,
        config: plugin.config ? JSON.parse(plugin.config) : null,
        hooks: plugin.hooks ? JSON.parse(plugin.hooks) : null
      };
    });
    
    return NextResponse.json(enhancedPlugins);
  } catch (error) {
    console.error('获取插件出错:', error);
    
    return NextResponse.json(
      { message: '获取插件列表失败: ' + error.message },
      { status: 500 }
    );
  }
}

// 处理 PUT 请求 - 添加或更新插件
export async function PUT(req) {
  try {
    // 验证用户是否为管理员
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    const pluginData = await req.json();
    
    // 验证必填字段
    if (!pluginData.name || !pluginData.displayName || !pluginData.main) {
      return NextResponse.json(
        { message: '名称、显示名称和主入口文件为必填项' },
        { status: 400 }
      );
    }
    
    // 检查配置和钩子是否为有效的JSON
    let config = null;
    let hooks = null;
    
    if (pluginData.config) {
      try {
        // 如果是字符串，尝试解析
        if (typeof pluginData.config === 'string') {
          config = JSON.parse(pluginData.config);
        } else {
          config = pluginData.config;
        }
      } catch (error) {
        return NextResponse.json(
          { message: '配置不是有效的JSON格式' },
          { status: 400 }
        );
      }
    }
    
    if (pluginData.hooks) {
      try {
        // 如果是字符串，尝试解析
        if (typeof pluginData.hooks === 'string') {
          hooks = JSON.parse(pluginData.hooks);
        } else {
          hooks = pluginData.hooks;
        }
      } catch (error) {
        return NextResponse.json(
          { message: '钩子不是有效的JSON格式' },
          { status: 400 }
        );
      }
    }
    
    // 确保插件目录存在
    const pluginDir = ensurePluginDirectory(pluginData.name);
    
    // 创建默认插件文件（如果不存在）
    const mainFilePath = createDefaultPluginFile(pluginDir, pluginData.main);
    
    // 添加或更新插件记录
    const plugin = await prisma.plugin.upsert({
      where: {
        name: pluginData.name
      },
      update: {
        displayName: pluginData.displayName,
        description: pluginData.description || null,
        version: pluginData.version || '1.0.0',
        author: pluginData.author || null,
        homepage: pluginData.homepage || null,
        repository: pluginData.repository || null,
        main: pluginData.main,
        enabled: pluginData.enabled || false,
        config: config ? JSON.stringify(config) : null,
        hooks: hooks ? JSON.stringify(hooks) : null
      },
      create: {
        name: pluginData.name,
        displayName: pluginData.displayName,
        description: pluginData.description || null,
        version: pluginData.version || '1.0.0',
        author: pluginData.author || null,
        homepage: pluginData.homepage || null,
        repository: pluginData.repository || null,
        main: pluginData.main,
        enabled: pluginData.enabled || false,
        config: config ? JSON.stringify(config) : null,
        hooks: hooks ? JSON.stringify(hooks) : null
      }
    });
    
    // 如果插件状态变更，需要重新加载插件
    const pluginManager = PluginManager.getInstance();
    
    if (pluginData.enabled) {
      await pluginManager.loadPlugin(plugin);
    } else {
      await pluginManager.unloadPlugin(plugin.name);
    }
    
    // 返回解析后的插件数据
    return NextResponse.json({
      message: '插件已保存',
      plugin: {
        ...plugin,
        config: config,
        hooks: hooks,
        isLoaded: pluginData.enabled
      }
    });
  } catch (error) {
    console.error('保存插件出错:', error);
    
    return NextResponse.json(
      { message: '保存插件失败: ' + error.message },
      { status: 500 }
    );
  }
}

// 处理 DELETE 请求 - 删除插件
export async function DELETE(req) {
  try {
    // 验证用户是否为管理员
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取请求参数
    const url = new URL(req.url);
    const pluginId = url.searchParams.get('id');
    
    if (!pluginId) {
      return NextResponse.json(
        { message: '缺少插件ID' },
        { status: 400 }
      );
    }
    
    // 查找插件
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId }
    });
    
    if (!plugin) {
      return NextResponse.json(
        { message: '插件不存在' },
        { status: 404 }
      );
    }
    
    // 卸载插件
    const pluginManager = PluginManager.getInstance();
    await pluginManager.unloadPlugin(plugin.name);
    
    // 删除插件目录
    const pluginDir = path.join(process.cwd(), 'plugins', plugin.name);
    deleteDirectory(pluginDir);
    
    // 删除数据库记录
    await prisma.plugin.delete({
      where: { id: pluginId }
    });
    
    return NextResponse.json({ message: '插件已删除' });
  } catch (error) {
    console.error('删除插件出错:', error);
    
    return NextResponse.json(
      { message: '删除插件失败: ' + error.message },
      { status: 500 }
    );
  }
}

// 处理 POST 请求 - 安装插件
export async function POST(req) {
  try {
    // 验证用户是否为管理员
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    const { source } = await req.json();
    
    if (!source) {
      return NextResponse.json(
        { message: '缺少插件源' },
        { status: 400 }
      );
    }
    
    // 确保插件根目录存在
    const pluginsDir = path.join(process.cwd(), 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir);
    }
    
    let pluginName, pluginDir;
    
    // 检查是GitHub还是npm包
    if (source.includes('github.com')) {
      // 从GitHub URL解析仓库名
      const repoMatch = source.match(/github\.com\/[^\/]+\/([^\/]+)/);
      
      if (!repoMatch) {
        return NextResponse.json(
          { message: '无效的GitHub仓库URL' },
          { status: 400 }
        );
      }
      
      pluginName = repoMatch[1];
      pluginDir = path.join(pluginsDir, pluginName);
      
      try {
        // 如果目录已存在，先删除
        if (fs.existsSync(pluginDir)) {
          deleteDirectory(pluginDir);
        }
        
        // 克隆仓库
        await execAsync(`git clone ${source} ${pluginDir}`);
      } catch (error) {
        return NextResponse.json(
          { message: '克隆GitHub仓库失败: ' + error.message },
          { status: 500 }
        );
      }
    } else {
      // 假设是NPM包
      pluginName = source.split('/').pop(); // 获取包名的最后部分
      pluginDir = path.join(pluginsDir, pluginName);
      
      try {
        // 如果目录已存在，先删除
        if (fs.existsSync(pluginDir)) {
          deleteDirectory(pluginDir);
        }
        
        // 创建目录
        fs.mkdirSync(pluginDir);
        
        // 在插件目录安装
        await execAsync(`cd ${pluginDir} && npm init -y && npm install ${source}`);
      } catch (error) {
        return NextResponse.json(
          { message: '安装NPM包失败: ' + error.message },
          { status: 500 }
        );
      }
    }
    
    // 读取package.json获取插件信息
    const packageJsonPath = path.join(pluginDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return NextResponse.json(
        { message: '插件缺少package.json文件' },
        { status: 400 }
      );
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 创建插件记录
    const plugin = await prisma.plugin.create({
      data: {
        name: pluginName,
        displayName: packageJson.name || pluginName,
        description: packageJson.description || null,
        version: packageJson.version || '1.0.0',
        author: packageJson.author || null,
        homepage: packageJson.homepage || null,
        repository: typeof packageJson.repository === 'object' 
          ? packageJson.repository.url 
          : packageJson.repository || source,
        main: packageJson.main || 'index.js',
        enabled: false,
        config: null,
        hooks: null
      }
    });
    
    return NextResponse.json({
      message: '插件已安装',
      plugin: {
        ...plugin,
        config: null,
        hooks: null,
        isLoaded: false
      }
    });
  } catch (error) {
    console.error('安装插件出错:', error);
    
    return NextResponse.json(
      { message: '安装插件失败: ' + error.message },
      { status: 500 }
    );
  }
} 