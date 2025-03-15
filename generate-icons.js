const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保图标目录存在
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 定义需要生成的图标尺寸
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG源文件路径
const svgPath = path.join(__dirname, 'public', 'icons', 'app-icon.svg');

// 为每个尺寸生成PNG图标
sizes.forEach(size => {
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  try {
    // 使用svgexport将SVG转换为PNG
    const command = `svgexport ${svgPath} ${outputPath} ${size}:${size}`;
    console.log(`Generating ${size}x${size} icon...`);
    execSync(command);
    console.log(`✓ Generated ${outputPath}`);
  } catch (error) {
    console.error(`Error generating ${size}x${size} icon:`, error.message);
  }
});

console.log('Icon generation complete!'); 