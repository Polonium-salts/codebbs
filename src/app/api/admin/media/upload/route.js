import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; 

// 允许的文件类型
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

// 上传文件
export async function POST(request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 解析FormData
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: '未提供文件' },
        { status: 400 }
      );
    }
    
    // 存储上传结果
    const uploadResults = [];
    const errors = [];
    
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // 忽略目录已存在的错误
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // 处理每个文件
    for (const file of files) {
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`文件 ${file.name} 超过最大大小限制（10MB）`);
        continue;
      }
      
      // 验证文件类型
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`文件 ${file.name} 类型不被支持`);
        continue;
      }
      
      // 生成唯一文件名
      const fileExtension = path.extname(file.name);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      const relativeFilePath = `/uploads/${fileName}`;
      
      // 获取文件的ArrayBuffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // 写入文件
      await writeFile(filePath, buffer);
      
      // 创建数据库记录
      const mediaFile = await prisma.mediaFile.create({
        data: {
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          url: relativeFilePath,
          uploadedBy: {
            connect: { id: session.user.id }
          }
        }
      });
      
      uploadResults.push(mediaFile);
    }
    
    // 返回结果
    return NextResponse.json({
      message: `成功上传 ${uploadResults.length} 个文件${errors.length > 0 ? '，但有部分错误' : ''}`,
      files: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });
  } catch (error) {
    console.error('上传文件出错:', error);
    return NextResponse.json(
      { message: '上传文件时发生错误' },
      { status: 500 }
    );
  }
} 