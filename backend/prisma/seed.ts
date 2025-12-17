import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@netflow.co.tz' },
    update: {},
    create: {
      email: 'admin@netflow.co.tz',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample routers
  const routers = await Promise.all([
    prisma.router.upsert({
      where: { ipAddress: '192.168.1.1' },
      update: {},
      create: {
        name: 'Main Lobby - NetFlow WiFi',
        ipAddress: '192.168.1.1',
        macAddress: '00:11:22:33:44:55',
        location: 'Main Lobby & Reception Area',
        status: 'ONLINE',
        signalStrength: 95,
        activeUsers: 12,
        lastSeen: new Date()
      }
    }),
    prisma.router.upsert({
      where: { ipAddress: '192.168.1.2' },
      update: {},
      create: {
        name: 'Cafe & Restaurant WiFi',
        ipAddress: '192.168.1.2',
        macAddress: '00:11:22:33:44:56',
        location: 'Cafe & Restaurant Area',
        status: 'ONLINE',
        signalStrength: 88,
        activeUsers: 8,
        lastSeen: new Date()
      }
    }),
    prisma.router.upsert({
      where: { ipAddress: '192.168.1.3' },
      update: {},
      create: {
        name: 'Conference Room WiFi',
        ipAddress: '192.168.1.3',
        macAddress: '00:11:22:33:44:57',
        location: 'Conference Room - Floor 2',
        status: 'ONLINE',
        signalStrength: 92,
        activeUsers: 5,
        lastSeen: new Date()
      }
    }),
    prisma.router.upsert({
      where: { ipAddress: '192.168.1.4' },
      update: {},
      create: {
        name: 'Guest Rooms WiFi',
        ipAddress: '192.168.1.4',
        macAddress: '00:11:22:33:44:58',
        location: 'Guest Rooms - Floors 3-5',
        status: 'ONLINE',
        signalStrength: 85,
        activeUsers: 15,
        lastSeen: new Date()
      }
    })
  ]);

  console.log('✅ Sample routers created:', routers.length);

  // Create sample packages with realistic pricing
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { id: 'pkg-30min' },
      update: {},
      create: {
        id: 'pkg-30min',
        name: 'Quick Browse - 30 Minutes',
        duration: 30, // 30 minutes
        price: 30000, // 300 TZS in cents
        description: 'Perfect for quick social media check and emails',
        isActive: true
      }
    }),
    prisma.package.upsert({
      where: { id: 'pkg-1hour' },
      update: {},
      create: {
        id: 'pkg-1hour',
        name: '1 Hour Access',
        duration: 60, // 1 hour in minutes
        price: 50000, // 500 TZS in cents
        description: 'Ideal for browsing, social media, and light work',
        isActive: true
      }
    }),
    prisma.package.upsert({
      where: { id: 'pkg-24hours' },
      update: {},
      create: {
        id: 'pkg-24hours',
        name: '24 Hours Access',
        duration: 1440, // 24 hours in minutes
        price: 100000, // 1000 TZS in cents
        description: 'Full day access for work, streaming, and entertainment',
        isActive: true
      }
    }),
    prisma.package.upsert({
      where: { id: 'pkg-7days' },
      update: {},
      create: {
        id: 'pkg-7days',
        name: '7 Days Access',
        duration: 10080, // 7 days in minutes
        price: 500000, // 5000 TZS in cents
        description: 'Weekly package perfect for business trips and extended stays',
        isActive: true
      }
    }),
    prisma.package.upsert({
      where: { id: 'pkg-30days' },
      update: {},
      create: {
        id: 'pkg-30days',
        name: '30 Days Unlimited',
        duration: 43200, // 30 days in minutes
        price: 1500000, // 15000 TZS in cents
        description: 'Monthly unlimited access for residents and long-term guests',
        isActive: true
      }
    })
  ]);

  console.log('✅ Sample packages created:', packages.length);

  // Create sample sessions and payments with realistic data
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const sampleSessions = await Promise.all([
    // Active sessions
    prisma.session.create({
      data: {
        deviceMac: '00:AA:BB:CC:DD:01',
        deviceName: 'iPhone 13 Pro',
        ipAddress: '192.168.1.100',
        routerId: routers[0].id,
        packageId: packages[2].id, // 24 hours
        status: 'ACTIVE',
        startTime: oneHourAgo,
        expiresAt: oneDayFromNow,
        bytesUp: BigInt(2048000), // 2MB up
        bytesDown: BigInt(15360000) // 15MB down
      }
    }),
    prisma.session.create({
      data: {
        deviceMac: '00:AA:BB:CC:DD:02',
        deviceName: 'Samsung Galaxy S23',
        ipAddress: '192.168.1.101',
        routerId: routers[1].id,
        packageId: packages[1].id, // 1 hour
        status: 'ACTIVE',
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        expiresAt: oneHourFromNow,
        bytesUp: BigInt(1024000), // 1MB up
        bytesDown: BigInt(8192000) // 8MB down
      }
    }),
    prisma.session.create({
      data: {
        deviceMac: '00:AA:BB:CC:DD:03',
        deviceName: 'MacBook Pro',
        ipAddress: '192.168.1.102',
        routerId: routers[2].id,
        packageId: packages[0].id, // 30 minutes
        status: 'ACTIVE',
        startTime: new Date(now.getTime() - 15 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
        bytesUp: BigInt(5120000), // 5MB up
        bytesDown: BigInt(25600000) // 25MB down
      }
    }),
    // Expired session
    prisma.session.create({
      data: {
        deviceMac: '00:AA:BB:CC:DD:04',
        deviceName: 'iPad Air',
        ipAddress: '192.168.1.103',
        routerId: routers[0].id,
        packageId: packages[0].id, // 30 minutes
        status: 'EXPIRED',
        startTime: threeHoursAgo,
        expiresAt: twoHoursAgo,
        endTime: twoHoursAgo,
        bytesUp: BigInt(512000), // 512KB up
        bytesDown: BigInt(3072000) // 3MB down
      }
    }),
    // Terminated session
    prisma.session.create({
      data: {
        deviceMac: '00:AA:BB:CC:DD:05',
        deviceName: 'OnePlus 11',
        ipAddress: '192.168.1.104',
        routerId: routers[1].id,
        packageId: packages[1].id, // 1 hour
        status: 'TERMINATED',
        startTime: twoHoursAgo,
        expiresAt: oneHourFromNow,
        endTime: oneHourAgo,
        bytesUp: BigInt(768000), // 768KB up
        bytesDown: BigInt(4096000) // 4MB down
      }
    })
  ]);

  // Create payments for the sessions
  await Promise.all([
    // Payment for active 24-hour session
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[0].id,
        packageId: packages[2].id,
        amount: packages[2].price,
        paymentMethod: 'MPESA',
        phoneNumber: '+255712345678',
        status: 'COMPLETED',
        paymentReference: 'MP' + Date.now().toString().slice(-8),
        paidAt: oneHourAgo
      }
    }),
    // Payment for active 1-hour session
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[1].id,
        packageId: packages[1].id,
        amount: packages[1].price,
        paymentMethod: 'TIGO_PESA',
        phoneNumber: '+255687654321',
        status: 'COMPLETED',
        paymentReference: 'TP' + Date.now().toString().slice(-8),
        paidAt: new Date(now.getTime() - 30 * 60 * 1000)
      }
    }),
    // Payment for active 30-minute session
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[2].id,
        packageId: packages[0].id,
        amount: packages[0].price,
        paymentMethod: 'AIRTEL_MONEY',
        phoneNumber: '+255765432109',
        status: 'COMPLETED',
        paymentReference: 'AM' + Date.now().toString().slice(-8),
        paidAt: new Date(now.getTime() - 15 * 60 * 1000)
      }
    }),
    // Payment for expired session
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[3].id,
        packageId: packages[0].id,
        amount: packages[0].price,
        paymentMethod: 'MPESA',
        phoneNumber: '+255798765432',
        status: 'COMPLETED',
        paymentReference: 'MP' + (Date.now() - 10800000).toString().slice(-8),
        paidAt: threeHoursAgo
      }
    }),
    // Payment for terminated session
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[4].id,
        packageId: packages[1].id,
        amount: packages[1].price,
        paymentMethod: 'TIGO_PESA',
        phoneNumber: '+255654321098',
        status: 'COMPLETED',
        paymentReference: 'TP' + (Date.now() - 7200000).toString().slice(-8),
        paidAt: twoHoursAgo
      }
    }),
    // Some additional payments for revenue stats
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[0].id, // Reuse session ID (extension payment)
        packageId: packages[3].id, // 7 days package
        amount: packages[3].price,
        paymentMethod: 'MPESA',
        phoneNumber: '+255712345678',
        status: 'COMPLETED',
        paymentReference: 'MP' + (Date.now() - 86400000).toString().slice(-8),
        paidAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday
      }
    }),
    // Failed payment example
    prisma.payment.create({
      data: {
        sessionId: sampleSessions[1].id,
        packageId: packages[1].id,
        amount: packages[1].price,
        paymentMethod: 'AIRTEL_MONEY',
        phoneNumber: '+255723456789',
        status: 'FAILED',
        paymentReference: null
      }
    })
  ]);

  console.log('✅ Sample sessions and payments created:', sampleSessions.length);

  // Create system settings
  const settings = await Promise.all([
    prisma.systemSettings.upsert({
      where: { key: 'company_name' },
      update: {},
      create: {
        key: 'company_name',
        value: 'NetFlow WiFi Management',
        type: 'string'
      }
    }),
    prisma.systemSettings.upsert({
      where: { key: 'portal_title' },
      update: {},
      create: {
        key: 'portal_title',
        value: 'Welcome to NetFlow',
        type: 'string'
      }
    }),
    prisma.systemSettings.upsert({
      where: { key: 'portal_subtitle' },
      update: {},
      create: {
        key: 'portal_subtitle',
        value: 'Get connected in seconds',
        type: 'string'
      }
    }),
    prisma.systemSettings.upsert({
      where: { key: 'max_devices_per_user' },
      update: {},
      create: {
        key: 'max_devices_per_user',
        value: '1',
        type: 'number'
      }
    }),
    prisma.systemSettings.upsert({
      where: { key: 'session_timeout_warning' },
      update: {},
      create: {
        key: 'session_timeout_warning',
        value: '300', // 5 minutes in seconds
        type: 'number'
      }
    })
  ]);

  console.log('✅ System settings created:', settings.length);

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Email: admin@netflow.co.tz');
  console.log('   Password: admin123');
  console.log('');
  console.log('🌐 Sample data includes:');
  console.log('   - 3 routers (2 online, 1 offline)');
  console.log('   - 4 packages (1hr, 24hr, 7d, 30d)');
  console.log('   - 2 active sessions with payments');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });