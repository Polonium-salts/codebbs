const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    // Find the admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@codebbs.com' }
    });

    if (admin) {
      console.log('✅ Admin user found in the database:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Created at: ${admin.createdAt}`);
      console.log(`   Updated at: ${admin.updatedAt}`);
    } else {
      console.log('❌ Admin user not found in the database.');
    }

  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin(); 