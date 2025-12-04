import { query, initializeDatabase } from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

async function main() {
  try {
    // Initialize database tables
    await initializeDatabase();

    console.log('🌱 Seeding database...');

    // Create a test user
    const userId = uuidv4();
    await query(
      'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)',
      [userId, 'test@example.com', 'Test User', null]
    );
    console.log('✅ User created');

    // Create business settings for the user
    const settingsId = uuidv4();
    await query(
      'INSERT INTO business_settings (id, userId, storeName, timezone, currency, emailNotifications, notificationEmail) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [settingsId, userId, 'Toko Uji', 'Asia/Jakarta', 'IDR', true, 'test@example.com']
    );
    console.log('✅ Business settings created');

    // Create products
    const products = [
      { name: 'Laptop', category: 'Elektronik', price: 8000000, costPrice: 6000000, stock: 5, minStock: 2, unit: 'pcs' },
      { name: 'Mouse', category: 'Aksesoris', price: 150000, costPrice: 80000, stock: 50, minStock: 10, unit: 'pcs' },
      { name: 'Keyboard', category: 'Aksesoris', price: 350000, costPrice: 200000, stock: 30, minStock: 5, unit: 'pcs' },
      { name: 'Monitor', category: 'Elektronik', price: 2000000, costPrice: 1200000, stock: 8, minStock: 2, unit: 'pcs' },
      { name: 'USB Cable', category: 'Kabel', price: 45000, costPrice: 20000, stock: 100, minStock: 20, unit: 'pcs' },
      { name: 'HDMI Cable', category: 'Kabel', price: 75000, costPrice: 35000, stock: 80, minStock: 15, unit: 'pcs' },
      { name: 'Webcam', category: 'Elektronik', price: 500000, costPrice: 300000, stock: 12, minStock: 3, unit: 'pcs' },
      { name: 'Microphone', category: 'Audio', price: 200000, costPrice: 100000, stock: 15, minStock: 3, unit: 'pcs' },
    ];

    const productIds: string[] = [];
    for (const product of products) {
      const productId = uuidv4();
      await query(
        'INSERT INTO products (id, userId, name, category, price, costPrice, stock, minStock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [productId, userId, product.name, product.category, product.price, product.costPrice, product.stock, product.minStock, product.unit]
      );
      productIds.push(productId);
    }
    console.log(`✅ ${products.length} products created`);

    // Create sales data for the last 30 days
    const today = new Date();
    const sales = [];

    for (let i = 0; i < 30; i++) {
      const saleDate = new Date(today);
      saleDate.setDate(saleDate.getDate() - i);
      const dateStr = saleDate.toISOString().split('T')[0];

      // Create 2-5 sales per day
      const numSalesPerDay = Math.floor(Math.random() * 4) + 2;

      for (let j = 0; j < numSalesPerDay; j++) {
        const productIdx = Math.floor(Math.random() * products.length);
        const product = products[productIdx];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const total = product.price * quantity;

        const saleId = uuidv4();
        await query(
          'INSERT INTO sales (id, userId, date, productId, productName, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [saleId, userId, dateStr, productIds[productIdx], product.name, quantity, product.price, total]
        );

        sales.push({ saleId, dateStr, productName: product.name, quantity, total });
      }
    }
    console.log(`✅ ${sales.length} sales records created`);

    // Create some activity logs
    const activityId = uuidv4();
    await query(
      'INSERT INTO activity_logs (id, userId, userName, action, details) VALUES (?, ?, ?, ?, ?)',
      [activityId, userId, 'Test User', 'seed', 'Database seeded with test data']
    );

    console.log('✅ Activity logs created');
    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\nTest credentials:`);
    console.log(`Email: test@example.com`);
    console.log(`\nTotal created:`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Sales: ${sales.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
