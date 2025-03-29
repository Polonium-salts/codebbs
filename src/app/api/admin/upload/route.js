import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 处理POST请求，上传图片
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
    const file = formData.get('file');
    const type = formData.get('type') || 'image'; // logo, favicon 或普通图片
    
    // 检查文件是否存在
    if (!file) {
      return NextResponse.json(
        { message: '没有接收到文件' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: '只允许上传图片文件' },
        { status: 400 }
      );
    }
    
    // 检查文件大小 (最大2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { message: '图片大小不能超过2MB' },
        { status: 400 }
      );
    }
    
    // 创建存储目录
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // 生成唯一文件名
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 获取文件后缀
    const originalName = file.name;
    const ext = extname(originalName).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
    if (!validExtensions.includes(ext)) {
      return NextResponse.json(
        { message: '不支持的图片格式，请上传JPG, PNG, GIF, WebP或SVG格式的图片' },
        { status: 400 }
      );
    }
    
    // 生成文件名和路径
    const fileName = `${type}-${uuidv4().substring(0, 8)}${ext}`;
    const filePath = join(uploadDir, fileName);
    
    try {
      // 根据类型处理图片
      if (type === 'logo') {
        // Logo优化 - 保持透明度，调整尺寸，建议宽度200px
        if (ext !== '.svg') {
          await sharp(buffer)
            .resize(200, null, { withoutEnlargement: true })
            .toFormat('png')
            .toFile(filePath.replace(ext, '.png'));
        } else {
          // SVG文件直接写入
          await writeFile(filePath, buffer);
        }
      } else if (type === 'favicon') {
        // Favicon优化 - 调整为32x32像素的正方形
        if (ext !== '.svg') {
          await sharp(buffer)
            .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .toFormat('png')
            .toFile(filePath.replace(ext, '.png'));
        } else {
          // SVG文件直接写入
          await writeFile(filePath, buffer);
        }
      } else {
        // 普通图片 - 根据需要进行优化
        if (ext !== '.svg' && ext !== '.gif') {
          // 优化静态图片，保持原始宽高比但限制最大尺寸
          await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .toFile(filePath);
        } else {
          // SVG和GIF文件直接写入
          await writeFile(filePath, buffer);
        }
      }
      
      // 返回成功响应，包含URL
      const fileUrl = `/uploads/${fileName.replace(ext, ext !== '.svg' && (type === 'logo' || type === 'favicon') ? '.png' : ext)}`;
      
      return NextResponse.json({
        message: '文件上传成功',
        url: fileUrl
      });
    } catch (error) {
      console.error('处理图片过程中出错:', error);
      return NextResponse.json(
        { message: '处理图片过程中出错', error: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('上传文件过程中出错:', error);
    return NextResponse.json(
      { message: '上传文件过程中出错', error: error.message },
      { status: 500 }
    );
  }
} 