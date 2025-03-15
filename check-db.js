const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('正在检查数据库状态...');
    
    // 检查用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      }
    });
    
    console.log('\n用户 (总计: ' + users.length + '):');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  帖子: ${user._count.posts}, 评论: ${user._count.comments}`);
    });

    // 检查分类
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });
    
    console.log('\n分类 (总计: ' + categories.length + '):');
    categories.forEach(category => {
      console.log(`- ${category.name}: ${category._count.posts} 个帖子`);
    });

    // 检查帖子
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        published: true,
        author: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });
    
    console.log('\n帖子 (总计: ' + posts.length + '):');
    posts.forEach(post => {
      console.log(`- ${post.title} (作者: ${post.author.name})`);
      console.log(`  状态: ${post.published ? '已发布' : '未发布'}, 评论: ${post._count.comments}`);
    });

  } catch (error) {
    console.error('检查数据库时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 