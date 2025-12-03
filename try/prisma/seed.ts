import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.sale.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.businessSettings.deleteMany({});

  // Seed Products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Keripik Singkong',
        category: 'Makanan Ringan',
        price: 15000,
        costPrice: 8000,
        stock: 150,
        minStock: 30,
        unit: 'pcs',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Keripik Pisang',
        category: 'Makanan Ringan',
        price: 12000,
        costPrice: 6000,
        stock: 80,
        minStock: 25,
        unit: 'pcs',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Kopi Bubuk Premium',
        category: 'Minuman',
        price: 35000,
        costPrice: 20000,
        stock: 45,
        minStock: 20,
        unit: 'pcs',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Teh Celup',
        category: 'Minuman',
        price: 8000,
        costPrice: 4000,
        stock: 200,
        minStock: 50,
        unit: 'box',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Sambal Terasi',
        category: 'Bumbu',
        price: 18000,
        costPrice: 10000,
        stock: 25,
        minStock: 15,
        unit: 'botol',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Madu Murni',
        category: 'Minuman',
        price: 75000,
        costPrice: 45000,
        stock: 30,
        minStock: 10,
        unit: 'botol',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Kacang Goreng',
        category: 'Makanan Ringan',
        price: 10000,
        costPrice: 5000,
        stock: 120,
        minStock: 40,
        unit: 'pcs',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
      {
        name: 'Gula Aren',
        category: 'Bumbu',
        price: 25000,
        costPrice: 15000,
        stock: 60,
        minStock: 20,
        unit: 'kg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-30'),
      },
    ],
  });

  console.log(`Seeded ${products.count} products`);

  // Get all products for sales data
  const allProducts = await prisma.product.findMany();

  // Generate and seed sales data for the last 30 days
  const sales = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Random number of transactions per day (3-10)
    const transactionsPerDay = Math.floor(Math.random() * 8) + 3;

    for (let j = 0; j < transactionsPerDay; j++) {
      const product = allProducts[Math.floor(Math.random() * allProducts.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;

      // Add some patterns - weekends have more sales
      const dayOfWeek = date.getDay();
      const weekendBonus = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1;
      const finalQuantity = Math.ceil(quantity * weekendBonus);

      sales.push({
        date: dateStr,
        productId: product.id,
        productName: product.name,
        quantity: finalQuantity,
        price: product.price,
        total: finalQuantity * product.price,
        createdAt: date,
      });
    }
  }

  await prisma.sale.createMany({
    data: sales,
  });

  console.log(`Seeded ${sales.length} sales records`);

  // Seed Users
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@umkm.local',
      role: 'admin',
    },
  });

  // Seed Business Settings
  await prisma.businessSettings.create({
    data: {
      businessName: 'UMKM Sejahtera',
      businessType: 'retail',
      storeName: 'Toko UMKM Sejahtera',
      storeAddress: 'Jl. Contoh No. 123, Jakarta',
      timezone: 'Asia/Jakarta',
      currency: 'IDR',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
