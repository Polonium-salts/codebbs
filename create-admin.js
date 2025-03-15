const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Create a new PrismaClient instance
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Admin user details - you can modify these as needed
    const adminData = {
      name: 'Administrator',
      email: 'admin@codebbs.com',
      password: 'admin123', // This will be hashed before storing
      image: 'https://ui-avatars.com/api/?name=Administrator&background=0D8ABC&color=fff',
      bio: 'System administrator'
    };

    console.log('Creating admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    console.log('Password hashed successfully');

    // Create or update the admin user
    const admin = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {
        name: adminData.name,
        password: hashedPassword,
        image: adminData.image,
        bio: adminData.bio,
        updatedAt: new Date()
      },
      create: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        image: adminData.image,
        bio: adminData.bio
      }
    });

    console.log('✅ Admin user created/updated successfully:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminData.password} (unencrypted for your reference only)`);
    console.log('\nYou can now log in with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 