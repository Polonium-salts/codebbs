/**
 * 此脚本用于生成PWA所需的各种尺寸的图标
 * 使用方法:
 * 1. 安装依赖: npm install sharp
 * 2. 将一个高分辨率的图标放在项目根目录，命名为source-icon.png
 * 3. 运行: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 确保icons目录存在
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 需要生成的图标尺寸
const sizes = [72, 96, 128, 152, 192, 384, 512];

// 源图标路径
const sourceIcon = path.join(__dirname, '../source-icon.png');

// 检查源图标是否存在
if (!fs.existsSync(sourceIcon)) {
  console.error('错误: 源图标文件不存在。请将高分辨率图标放在项目根目录，命名为source-icon.png');
  process.exit(1);
}

// 生成不同尺寸的图标
async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(outputPath);
      
      console.log(`✅ 已生成 ${size}x${size} 图标`);
    }
    
    console.log('🎉 所有PWA图标已成功生成!');
  } catch (error) {
    console.error('生成图标时出错:', error);
    process.exit(1);
  }
}

generateIcons(); 