import { Product, Sale, DailySales, ProductSales, BusinessSettings } from './types';

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'p1',
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
    id: 'p2',
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
    id: 'p3',
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
    id: 'p4',
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
    id: 'p5',
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
    id: 'p6',
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
    id: 'p7',
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
    id: 'p8',
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
];

// Generate mock sales data for the last 30 days
function generateMockSales(): Sale[] {
  const sales: Sale[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random number of transactions per day (3-10)
    const transactionsPerDay = Math.floor(Math.random() * 8) + 3;
    
    for (let j = 0; j < transactionsPerDay; j++) {
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      
      // Add some patterns - weekends have more sales
      const dayOfWeek = date.getDay();
      const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;
      const finalQuantity = Math.ceil(quantity * weekendBonus);
      
      sales.push({
        id: `s${i}-${j}`,
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
  
  return sales;
}

export const mockSales: Sale[] = generateMockSales();

// Calculate daily sales summary
export function calculateDailySales(sales: Sale[]): DailySales[] {
  const dailyMap = new Map<string, DailySales>();
  
  sales.forEach(sale => {
    const existing = dailyMap.get(sale.date);
    if (existing) {
      existing.total += sale.total;
      existing.quantity += sale.quantity;
      existing.transactions += 1;
    } else {
      dailyMap.set(sale.date, {
        date: sale.date,
        total: sale.total,
        quantity: sale.quantity,
        transactions: 1,
      });
    }
  });
  
  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate product sales summary
export function calculateProductSales(sales: Sale[], days: number = 30): ProductSales[] {
  const productMap = new Map<string, ProductSales>();
  
  sales.forEach(sale => {
    const existing = productMap.get(sale.productId);
    if (existing) {
      existing.totalQuantity += sale.quantity;
      existing.totalRevenue += sale.total;
    } else {
      productMap.set(sale.productId, {
        productId: sale.productId,
        productName: sale.productName,
        totalQuantity: sale.quantity,
        totalRevenue: sale.total,
        averageDaily: 0,
      });
    }
  });
  
  // Calculate average daily
  productMap.forEach(product => {
    product.averageDaily = product.totalQuantity / days;
  });
  
  return Array.from(productMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// Default business settings
export const defaultSettings: BusinessSettings = {
  storeName: 'Toko UMKM Sejahtera',
  storeAddress: 'Jl. Contoh No. 123, Jakarta',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  categories: ['Makanan Ringan', 'Minuman', 'Bumbu', 'Sembako'],
  units: ['pcs', 'box', 'botol', 'kg', 'gram', 'liter'],
  minStockAlert: 20,
  nvidiaApiKey: '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',
  emailNotifications: false,
  notificationEmail: '',
};
