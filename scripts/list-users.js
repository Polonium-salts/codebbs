// 列出所有用户的脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('系统中的用户列表:');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('没有找到任何用户');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. 用户名: ${user.name || '未设置'}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role || 'USER'}`);
      console.log(`   创建时间: ${user.createdAt.toLocaleString()}`);
      console.log(`   ID: ${user.id}`);
      console.log('-'.repeat(80));
    });

    console.log(`共 ${users.length} 个用户`);
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 