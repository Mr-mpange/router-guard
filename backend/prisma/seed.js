const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@netflow.co.tz' },
    update: {},
    create: {
      email: 'admin@netflow.co.tz',
      password: hashedPassword,
      name: 'NetFlow Admin',
      role: 'ADMIN'
    }
  });

  console.log('Created admin user:', admin.email);

  // Create sample router
  const router = await prisma.router.upsert({
    where: { ipAddress: '192.168.1.1' },
    update: {},
    create: {
      name: 'Main Router',
      ipAddress: '192.168.1.1',
      macAddress: '00:11:22:33:44:55',
      location: 'Main Location',
      status: 'ONLINE',
      activeUsers: 0
    }
  });

  console.log('Created router:', router.name);

  // Create sample packages
  const packages = [
    {
      name: '1 Hour',
      duration: 60,
      price: 50000, // 500 TZS in cents
      description: 'Perfect for quick browsing'
    },
    {
      name: 'Daily',
      duration: 1440,
      price: 100000, // 1000 TZS in cents
      description: 'Full day internet access'
    },
    {
      name: 'Weekly',
      duration: 10080,
      price: 500000, // 5000 TZS in cents
      description: 'Week-long internet package'
    },
    {
      name: 'Monthly',
      duration: 43200,
      price: 2000000, // 20000 TZS in cents
      description: 'Monthly unlimited access'
    }
  ];

  for (const pkg of packages) {
    const existingPackage = await prisma.package.findFirst({
      where: { name: pkg.name }
    });
    
    if (!existingPackage) {
      const createdPackage = await prisma.package.create({
        data: pkg
      });
      console.log('Created package:', createdPackage.name);
    } else {
      console.log('Package already exists:', pkg.name);
    }
  }

  // Create system settings
  const settings = [
    { key: 'system_name', value: 'NetFlow WiFi', type: 'string' },
    { key: 'default_session_timeout', value: '1440', type: 'number' },
    { key: 'max_sessions_per_device', value: '1', type: 'number' },
    { key: 'enable_vouchers', value: 'true', type: 'boolean' }
  ];

  for (const setting of settings) {
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key: setting.key }
    });
    
    if (!existingSetting) {
      await prisma.systemSettings.create({
        data: setting
      });
      console.log('Created setting:', setting.key);
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });