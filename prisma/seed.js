const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@example.com',
        password: adminPassword,
        image: 'https://ui-avatars.com/api/?name=Admin',
      },
    });

    console.log('Admin user created:', admin.email);


    // Create categories
    const categories = [
      { name: 'General', description: 'General discussions' },
      { name: 'Technology', description: 'Technology related discussions' },
      { name: 'Programming', description: 'Programming related discussions' },
      { name: 'Off-Topic', description: 'Off-topic discussions' },
    ];

    for (const category of categories) {
      const createdCategory = await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
      console.log('Category created:', createdCategory.name);
    }

    // Get categories for reference
    const generalCategory = await prisma.category.findUnique({
      where: { name: 'General' },
    });

    const techCategory = await prisma.category.findUnique({
      where: { name: 'Technology' },
    });

    const programmingCategory = await prisma.category.findUnique({
      where: { name: 'Programming' },
    });

    // Create sample posts
    const posts = [
      {
        title: 'Welcome to our Forum!',
        content: 'This is the first post in our forum. Feel free to introduce yourself!',
        authorId: admin.id,
        categoryId: generalCategory.id,
      },
      {
        title: 'The Future of AI',
        content: 'What do you think about the future of artificial intelligence? Will it change our lives dramatically?',
        authorId: admin.id,
        categoryId: techCategory.id,
      },
      {
        title: 'Best Programming Languages for Beginners',
        content: 'What programming languages would you recommend for beginners? Python, JavaScript, or something else?',
        authorId: user.id,
        categoryId: programmingCategory.id,
      },
    ];

    for (const post of posts) {
      const createdPost = await prisma.post.create({
        data: post,
      });
      console.log('Post created:', createdPost.title);
    }

    // Get posts for reference
    const welcomePost = await prisma.post.findFirst({
      where: { title: 'Welcome to our Forum!' },
    });

    // Create sample comments
    const comments = [
      {
        content: 'Hello everyone! I\'m excited to be part of this community!',
        authorId: user.id,
        postId: welcomePost.id,
      },
      {
        content: 'Welcome to the forum! Feel free to explore and participate in discussions.',
        authorId: admin.id,
        postId: welcomePost.id,
      },
    ];

    for (const comment of comments) {
      const createdComment = await prisma.comment.create({
        data: comment,
      });
      console.log('Comment created for post:', welcomePost.title);
    }

    console.log('Seed data created successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 