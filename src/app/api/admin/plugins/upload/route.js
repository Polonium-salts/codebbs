import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { PluginManager } from '@/lib/plugin-manager';

// 处理插件上传
export async function POST(request) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 读取表单数据
    const formData = await request.formData();
    const zipFile = formData.get('file');
    
    if (!zipFile || !(zipFile instanceof File)) {
      return NextResponse.json(
        { message: '缺少上传文件' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    if (!zipFile.name.endsWith('.zip')) {
      return NextResponse.json(
        { message: '仅支持上传 .zip 格式的插件包' },
        { status: 400 }
      );
    }
    
    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), `plugin-upload-${uuidv4()}`);
    const uploadsDir = path.join(process.cwd(), '.next', 'uploads');
    const zipPath = path.join(uploadsDir, `${Date.now()}-${zipFile.name}`);
    
    // 确保临时文件夹存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 确保上传文件夹存在
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // 将上传的文件转换为Buffer
    const buffer = Buffer.from(await zipFile.arrayBuffer());
    
    // 保存上传的ZIP文件
    fs.writeFileSync(zipPath, buffer);
    
    // 解压ZIP文件
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // 在Windows上使用PowerShell解压
      if (process.platform === 'win32') {
        await execAsync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`);
      } else {
        // 在Linux/macOS上使用unzip
        await execAsync(`unzip -o "${zipPath}" -d "${tempDir}"`);
      }
    } catch (error) {
      fs.unlinkSync(zipPath); // 删除ZIP文件
      return NextResponse.json(
        { message: `解压文件失败: ${error.message}` },
        { status: 500 }
      );
    }
    
    // 解压后删除ZIP文件
    fs.unlinkSync(zipPath);
    
    // 读取插件信息
    const packageJsonPath = path.join(tempDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return NextResponse.json(
        { message: '插件包中缺少package.json文件' },
        { status: 400 }
      );
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 插件名称验证
    if (!packageJson.name) {
      return NextResponse.json(
        { message: 'package.json中缺少name字段' },
        { status: 400 }
      );
    }
    
    // 从package.json中提取插件信息
    const pluginName = packageJson.name.replace(/^codebbs-plugin-/, '');
    const pluginDir = path.join(process.cwd(), 'plugins', pluginName);
    
    // 如果插件目录已存在，先删除
    if (fs.existsSync(pluginDir)) {
      // 递归删除目录
      const deleteDir = (dir) => {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach((file) => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              // 递归删除子目录
              deleteDir(curPath);
            } else {
              // 删除文件
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(dir);
        }
      };
      
      deleteDir(pluginDir);
    }
    
    // 确保插件目录存在
    fs.mkdirSync(pluginDir, { recursive: true });
    
    // 复制插件文件到插件目录
    const copyDir = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    copyDir(tempDir, pluginDir);
    
    // 安装依赖（如果有package.json且有dependencies）
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
      try {
        await execAsync(`cd "${pluginDir}" && npm install --production`);
      } catch (error) {
        console.warn(`安装插件依赖警告: ${error.message}`);
        // 继续执行，不因为依赖安装失败而中断
      }
    }
    
    // 检查插件是否已存在
    const existingPlugin = await prisma.plugin.findUnique({
      where: { name: pluginName }
    });
    
    // 确定主入口文件
    const mainFile = packageJson.main || 'index.js';
    
    // 创建或更新插件记录
    let plugin;
    if (existingPlugin) {
      // 如果插件已启用，先卸载
      if (existingPlugin.enabled) {
        const pluginManager = PluginManager.getInstance();
        await pluginManager.unloadPlugin(pluginName);
      }
      
      // 更新插件
      plugin = await prisma.plugin.update({
        where: { id: existingPlugin.id },
        data: {
          displayName: packageJson.displayName || packageJson.name,
          description: packageJson.description || null,
          version: packageJson.version || '1.0.0',
          author: typeof packageJson.author === 'string' ? packageJson.author : 
                 packageJson.author?.name || null,
          homepage: packageJson.homepage || null,
          repository: typeof packageJson.repository === 'string' ? packageJson.repository : 
                     packageJson.repository?.url || null,
          main: mainFile,
          enabled: existingPlugin.enabled, // 保持原有的启用状态
          updatedAt: new Date()
        }
      });
    } else {
      // 创建新插件
      plugin = await prisma.plugin.create({
        data: {
          name: pluginName,
          displayName: packageJson.displayName || packageJson.name,
          description: packageJson.description || null,
          version: packageJson.version || '1.0.0',
          author: typeof packageJson.author === 'string' ? packageJson.author : 
                 packageJson.author?.name || null,
          homepage: packageJson.homepage || null,
          repository: typeof packageJson.repository === 'string' ? packageJson.repository : 
                     packageJson.repository?.url || null,
          main: mainFile,
          enabled: false,
          config: null,
          hooks: null
        }
      });
    }
    
    // 如果插件启用，则重新加载
    if (plugin.enabled) {
      const pluginManager = PluginManager.getInstance();
      await pluginManager.loadPlugin(plugin);
    }
    
    // 清理临时目录
    const deleteDir = (dir) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
          const curPath = path.join(dir, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            // 递归删除子目录
            deleteDir(curPath);
          } else {
            // 删除文件
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(dir);
      }
    };
    
    deleteDir(tempDir);
    
    return NextResponse.json({
      message: existingPlugin ? '插件已更新' : '插件已上传',
      plugin: {
        ...plugin,
        config: plugin.config ? JSON.parse(plugin.config) : null,
        hooks: plugin.hooks ? JSON.parse(plugin.hooks) : null,
        isLoaded: plugin.enabled
      }
    });
  } catch (error) {
    console.error('上传插件出错:', error);
    
    return NextResponse.json(
      { message: `上传插件失败: ${error.message}` },
      { status: 500 }
    );
  }
} 