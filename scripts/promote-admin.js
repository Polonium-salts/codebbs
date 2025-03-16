// 将用户提升为管理员的脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteToAdmin(email) {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`用户 ${email} 不存在`);
      return;
    }

    // 更新用户角色为 ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    console.log(`用户 ${updatedUser.name} (${updatedUser.email}) 已被提升为管理员`);
    console.log('用户信息:', updatedUser);
  } catch (error) {
    console.error('提升管理员失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 从命令行参数获取邮箱
const email = process.argv[2];

if (!email) {
  console.error('请提供用户邮箱作为参数');
  console.error('用法: node scripts/promote-admin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 