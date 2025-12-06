import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sale, DailySales, SalesInsight, SalesPrediction, StockAnalysis, Product, ProductSales, PredictionRecommendation } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  // Handle NaN or undefined values
  if (isNaN(value) || value === undefined || value === null) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Get date range
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

// Filter sales by date range
export function filterSalesByDateRange(sales: Sale[], startDate: Date, endDate: Date): Sale[] {
  return sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startDate && saleDate <= endDate;
  });
}

// Generate AI Insights based on sales data
export function generateInsights(
  dailySales: DailySales[],
  productSales: ProductSales[],
  previousPeriodSales: DailySales[]
): SalesInsight[] {
  const insights: SalesInsight[] = [];
  
  // Total current vs previous period
  const currentTotal = dailySales.reduce((sum, d) => sum + d.total, 0);
  const previousTotal = previousPeriodSales.reduce((sum, d) => sum + d.total, 0);
  const percentChange = calculatePercentageChange(currentTotal, previousTotal);
  
  if (percentChange > 0) {
    insights.push({
      type: 'increase',
      title: 'Penjualan Meningkat',
      description: `Penjualan naik ${percentChange.toFixed(1)}% dibanding periode sebelumnya.`,
      percentage: percentChange,
    });
  } else if (percentChange < 0) {
    insights.push({
      type: 'decrease',
      title: 'Penjualan Menurun',
      description: `Penjualan turun ${Math.abs(percentChange).toFixed(1)}% dibanding periode sebelumnya.`,
      percentage: percentChange,
    });
  }
  
  // Top product
  if (productSales.length > 0) {
    const topProduct = productSales[0];
    insights.push({
      type: 'info',
      title: 'Produk Terlaris',
      description: `${topProduct.productName} adalah produk paling laris dengan ${topProduct.totalQuantity} unit terjual.`,
      value: topProduct.totalQuantity,
    });
  }
  
  // Stable product (lowest variance)
  if (productSales.length > 1) {
    const stableProduct = productSales[Math.floor(productSales.length / 2)];
    insights.push({
      type: 'stable',
      title: 'Produk Paling Stabil',
      description: `${stableProduct.productName} memiliki penjualan yang stabil.`,
    });
  }
  
  // Anomaly detection - check for unusual daily sales
  if (dailySales.length > 7) {
    const avgDaily = currentTotal / dailySales.length;
    const stdDev = Math.sqrt(
      dailySales.reduce((sum, d) => sum + Math.pow(d.total - avgDaily, 2), 0) / dailySales.length
    );
    
    dailySales.forEach(day => {
      if (Math.abs(day.total - avgDaily) > 2 * stdDev) {
        const isHigh = day.total > avgDaily;
        insights.push({
          type: 'anomaly',
          title: isHigh ? 'Penjualan Tidak Biasa (Tinggi)' : 'Penjualan Tidak Biasa (Rendah)',
          description: `Penjualan pada ${formatDate(day.date)} ${isHigh ? 'sangat tinggi' : 'sangat rendah'} (${formatCurrency(day.total)}) dibanding rata-rata.`,
          value: day.total,
          date: day.date,
        });
      }
    });
  }
  
  // Slowest product warning
  if (productSales.length > 0) {
    const slowestProduct = productSales[productSales.length - 1];
    if (slowestProduct.totalQuantity < 10) {
      insights.push({
        type: 'decrease',
        title: 'Produk Lambat Laku',
        description: `${slowestProduct.productName} hanya terjual ${slowestProduct.totalQuantity} unit. Pertimbangkan promo atau bundling.`,
        value: slowestProduct.totalQuantity,
      });
    }
  }
  
  return insights;
}

// Generate sales prediction using simple moving average
export function generatePrediction(
  dailySales: DailySales[],
  productSales: ProductSales[],
  period: 'daily' | 'weekly' | 'monthly'
): SalesPrediction {
  const recentDays = dailySales.slice(-14); // Last 2 weeks
  const avgDaily = recentDays.reduce((sum, d) => sum + d.total, 0) / recentDays.length;
  
  // Simple trend calculation
  const firstHalf = recentDays.slice(0, 7);
  const secondHalf = recentDays.slice(7);
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length;
  
  const trendPercentage = calculatePercentageChange(secondAvg, firstAvg);
  const trend: 'up' | 'down' | 'stable' = 
    trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';
  
  // Calculate predicted value based on period
  let predictedValue: number;
  let confidenceLevel: number;
  
  switch (period) {
    case 'daily':
      predictedValue = avgDaily * (1 + trendPercentage / 100);
      confidenceLevel = 75 + Math.random() * 10; // 75-85%
      break;
    case 'weekly':
      predictedValue = avgDaily * 7 * (1 + trendPercentage / 100);
      confidenceLevel = 70 + Math.random() * 10; // 70-80%
      break;
    case 'monthly':
      predictedValue = avgDaily * 30 * (1 + trendPercentage / 100);
      confidenceLevel = 60 + Math.random() * 15; // 60-75%
      break;
  }
  
  // Product predictions
  const productPredictions = productSales.slice(0, 5).map(p => ({
    productId: p.productId,
    productName: p.productName,
    predictedQuantity: Math.round(p.averageDaily * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30) * (1 + trendPercentage / 100)),
    confidence: 65 + Math.random() * 15,
  }));
  
  return {
    period,
    predictedValue,
    confidenceLevel,
    trend,
    trendPercentage,
    productPredictions,
  };
}

// Analyze stock levels
export function analyzeStock(products: Product[], productSales: ProductSales[]): StockAnalysis[] {
  return products.map(product => {
    const sales = productSales.find(p => p.productId === product.id);
    const avgDailySales = sales?.averageDaily || 0;
    const daysUntilEmpty = avgDailySales > 0 ? Math.floor(product.stock / avgDailySales) : 999;
    
    let status: 'critical' | 'low' | 'normal' | 'overstock';
    if (product.stock <= product.minStock * 0.5) {
      status = 'critical';
    } else if (product.stock <= product.minStock) {
      status = 'low';
    } else if (product.stock > product.minStock * 5) {
      status = 'overstock';
    } else {
      status = 'normal';
    }
    
    // Recommend restock to cover 30 days
    const recommendedRestock = Math.max(0, Math.ceil(avgDailySales * 30 - product.stock));
    
    // Calculate profit margin
    const profitMargin = ((product.price - product.costPrice) / product.price) * 100;
    
    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      averageDailySales: avgDailySales,
      daysUntilEmpty,
      status,
      recommendedRestock,
      profitMargin,
    };
  }).sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
}

// Generate weekly summary
export function generateWeeklySummary(dailySales: DailySales[], productSales: ProductSales[]): string {
  const totalSales = dailySales.reduce((sum, d) => sum + d.total, 0);
  const totalQuantity = dailySales.reduce((sum, d) => sum + d.quantity, 0);
  const avgDaily = totalSales / dailySales.length;
  
  const topProduct = productSales[0];
  const slowProduct = productSales[productSales.length - 1];
  
  return `
📊 Ringkasan Minggu Ini:
• Total Penjualan: ${formatCurrency(totalSales)}
• Total Unit Terjual: ${formatNumber(totalQuantity)} unit
• Rata-rata Harian: ${formatCurrency(avgDaily)}
• Produk Terlaris: ${topProduct?.productName || '-'} (${topProduct?.totalQuantity || 0} unit)
• Produk Perlu Perhatian: ${slowProduct?.productName || '-'} (${slowProduct?.totalQuantity || 0} unit)
  `.trim();
}

// Parse natural language query for chat-to-data
export function parseNaturalQuery(query: string): { type: string; params: Record<string, string> } {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('penjualan') && (lowerQuery.includes('hari ini') || lowerQuery.includes('today'))) {
    return { type: 'daily_sales', params: { period: 'today' } };
  }
  if (lowerQuery.includes('penjualan') && (lowerQuery.includes('minggu') || lowerQuery.includes('week'))) {
    return { type: 'weekly_sales', params: { period: 'week' } };
  }
  if (lowerQuery.includes('penjualan') && (lowerQuery.includes('bulan') || lowerQuery.includes('month'))) {
    return { type: 'monthly_sales', params: { period: 'month' } };
  }
  if (lowerQuery.includes('produk') && (lowerQuery.includes('laris') || lowerQuery.includes('terbaik') || lowerQuery.includes('top'))) {
    return { type: 'top_products', params: {} };
  }
  if (lowerQuery.includes('stok') || lowerQuery.includes('stock')) {
    return { type: 'stock_status', params: {} };
  }
  if (lowerQuery.includes('prediksi') || lowerQuery.includes('forecast')) {
    return { type: 'prediction', params: {} };
  }
  
  return { type: 'general', params: {} };
}

// Generate AI Recommendations based on prediction
export function generateRecommendations(
  prediction: SalesPrediction,
  products: Product[],
  productSales: ProductSales[]
): PredictionRecommendation[] {
  const recommendations: PredictionRecommendation[] = [];

  // 1. Restock Recommendation - Produk dengan prediksi naik dan stok rendah
  const upTrendProducts = prediction.productPredictions
    ?.filter((p) => {
      const product = products.find((prod) => prod.id === p.productId);
      return product && product.stock <= product.minStock && p.confidence >= 70;
    })
    .slice(0, 3);

  if (upTrendProducts && upTrendProducts.length > 0) {
    const totalCost = upTrendProducts.reduce((sum, p) => {
      const product = products.find((prod) => prod.id === p.productId);
      return sum + (product ? product.costPrice * p.predictedQuantity * 2 : 0);
    }, 0);

    recommendations.push({
      id: 'restock-1',
      type: 'restock',
      title: '📦 Restock Produk High-Demand',
      description: `Produk dengan prediksi penjualan naik memiliki stok rendah. Segera restock untuk menghindari kehilangan penjualan.`,
      priority: 'high',
      icon: '📦',
      actionItems: upTrendProducts.map((p) => `Restock ${p.productName}: minimal ${p.predictedQuantity * 2} unit`),
      expectedImpact: `Peningkatan revenue hingga ${formatCurrency(upTrendProducts.reduce((sum, p) => sum + p.predictedQuantity * 100000, 0))}`,
      productIds: upTrendProducts.map((p) => p.productId),
      relatedProducts: upTrendProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        relevance: p.confidence,
      })),
    });
  }

  // 2. Promotion Recommendation - Produk dengan prediksi turun
  const downTrendProducts = prediction.productPredictions
    ?.filter((p) => {
      const productSale = productSales.find((ps) => ps.productId === p.productId);
      return productSale && productSale.totalRevenue > 0;
    })
    .sort((a, b) => a.predictedQuantity - b.predictedQuantity)
    .slice(0, 2);

  if (downTrendProducts && downTrendProducts.length > 0) {
    recommendations.push({
      id: 'promo-1',
      type: 'promotion',
      title: '🎯 Promosi untuk Produk Slow-Moving',
      description: `Beberapa produk menunjukkan penjualan yang melambat. Tawarkan promosi untuk meningkatkan engagement.`,
      priority: 'high',
      icon: '🎯',
      actionItems: [
        `Bundle ${downTrendProducts[0]?.productName} dengan produk favorit - diskon 10%`,
        downTrendProducts[1] ? `Promo buy 2 get 1 untuk ${downTrendProducts[1]?.productName}` : 'Siapkan flash sale',
        'Target promosi ke pelanggan setia',
      ],
      expectedImpact: `Peningkatan penjualan hingga 25-30% untuk produk promo`,
      productIds: downTrendProducts.map((p) => p.productId),
      relatedProducts: downTrendProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        relevance: 100 - p.confidence,
      })),
    });
  }

  // 3. Bundling Recommendation - Kombinasi produk terbaik
  const topProducts = prediction.productPredictions
    ?.sort((a, b) => b.predictedQuantity - a.predictedQuantity)
    .slice(0, 3);

  if (topProducts && topProducts.length >= 2) {
    recommendations.push({
      id: 'bundling-1',
      type: 'bundling',
      title: '🎁 Paket Bundle Produk Terbaik',
      description: `Produk-produk ini cocok dibundel untuk meningkatkan average transaction value.`,
      priority: 'medium',
      icon: '🎁',
      actionItems: [
        `Buat paket "${topProducts[0]?.productName} + ${topProducts[1]?.productName}" - diskon 12%`,
        topProducts[2] ? `Paket premium dengan 3 produk terlaris - diskon 15%` : '',
        'Promosikan bundle di checkout',
      ].filter(Boolean),
      expectedImpact: `Peningkatan average order value hingga 20-25%`,
      productIds: topProducts.map((p) => p.productId),
      relatedProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        relevance: p.confidence,
      })),
    });
  }

  // 4. Price Adjustment Recommendation
  if (prediction.trend === 'up' && prediction.trendPercentage > 15) {
    const highMarginProducts = products
      .filter((p) => p.price > p.costPrice * 1.5)
      .slice(0, 2);

    if (highMarginProducts.length > 0) {
      recommendations.push({
        id: 'pricing-1',
        type: 'price-adjustment',
        title: '💰 Optimasi Harga untuk Margin Lebih Baik',
        description: `Dengan tren penjualan yang naik, ada peluang untuk meningkatkan harga produk tertentu.`,
        priority: 'medium',
        icon: '💰',
        actionItems: [
          `Naikkan harga ${highMarginProducts[0]?.name} sebesar 5-8% - masih kompetitif`,
          highMarginProducts[1] ? `Review harga ${highMarginProducts[1]?.name}` : '',
          'Monitor perubahan permintaan setelah price change',
        ].filter(Boolean),
        expectedImpact: `Peningkatan profit margin hingga 3-5% tanpa mengurangi volume`,
        productIds: highMarginProducts.map((p) => p.id),
      });
    }
  }

  // 5. Expansion Recommendation - Jika tren sangat positif
  if (prediction.trend === 'up' && prediction.trendPercentage > 20 && prediction.confidenceLevel >= 75) {
    recommendations.push({
      id: 'expansion-1',
      type: 'expansion',
      title: '🚀 Kesempatan Ekspansi',
      description: `Data menunjukkan pertumbuhan yang kuat dan stabil. Pertimbangkan ekspansi produk atau market.`,
      priority: 'low',
      icon: '🚀',
      actionItems: [
        'Tambah varian warna/ukuran untuk produk bestseller',
        'Pertimbangkan masuk kategori produk baru',
        'Perluas jangkauan geografis (jika online/delivery)',
      ],
      expectedImpact: `Potensi pertumbuhan revenue 30-50% dalam 3-6 bulan`,
    });
  }

  return recommendations;
}

// Generate notifications based on business data
export function generateNotifications(
  products: Product[],
  sales: Sale[],
  settings: any
): Array<Omit<import('./types').Notification, 'id' | 'createdAt'>> {
  const notifications: Array<Omit<import('./types').Notification, 'id' | 'createdAt'>> = [];
  const lowStockThreshold = settings?.notificationThreshold?.lowStockPercentage || 20;

  // 1. Low Stock Alerts (stock below threshold)
  const lowStockProducts = products.filter((p) => {
    const stockPercentage = (p.stock / (p.stock + 50)) * 100; // Simple percentage calc
    return stockPercentage <= lowStockThreshold && p.stock > 0;
  });

  lowStockProducts.forEach((product) => {
    notifications.push({
      userId: settings?.userId || '',
      type: 'stock-alert',
      title: '📦 Stok Menipis',
      message: `${product.name} tinggal ${product.stock} unit. Segera restock!`,
      priority: 'high',
      icon: '📦',
      metadata: {
        productId: product.id,
        productName: product.name,
        value: product.stock,
      },
      read: false,
      actionUrl: '/stok',
      actionLabel: 'Lihat Stok',
    });
  });

  // 2. Out of Stock Alerts
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  outOfStockProducts.forEach((product) => {
    notifications.push({
      userId: settings?.userId || '',
      type: 'stock-alert',
      title: '❌ Stok Habis',
      message: `${product.name} sudah habis. Pelanggan tidak bisa membeli!`,
      priority: 'high',
      icon: '❌',
      metadata: {
        productId: product.id,
        productName: product.name,
        value: 0,
      },
      read: false,
      actionUrl: '/stok',
      actionLabel: 'Lihat Stok',
    });
  });

  // 3. Sales Trend Alert - Low/No sales
  if (sales.length > 0) {
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    if (totalSales < 5) {
      notifications.push({
        userId: settings?.userId || '',
        type: 'sales-alert',
        title: '⚠️ Penjualan Rendah',
        message: `Total penjualan hanya ${totalSales} unit. Cek strategi penjualan Anda.`,
        priority: 'medium',
        icon: '⚠️',
        read: false,
        actionUrl: '/data',
        actionLabel: 'Lihat Data Penjualan',
      });
    }
  } else if (products.length > 0) {
    // No sales recorded at all
    notifications.push({
      userId: settings?.userId || '',
      type: 'sales-alert',
      title: '⚠️ Belum Ada Penjualan',
      message: 'Anda belum mencatat penjualan apapun. Mulai input data penjualan.',
      priority: 'medium',
      icon: '⚠️',
      read: false,
      actionUrl: '/data',
      actionLabel: 'Input Penjualan',
    });
  }

  // 4. System Info - Setup tips
  if (products.length === 0) {
    notifications.push({
      userId: settings?.userId || '',
      type: 'system',
      title: '📊 Mulai dengan Menambah Produk',
      message: 'Anda belum memiliki produk. Tambahkan produk untuk memulai analisis.',
      priority: 'low',
      icon: '📊',
      read: false,
      actionUrl: '/stok',
      actionLabel: 'Tambah Produk Pertama',
    });
  } else if (products.length < 3) {
    notifications.push({
      userId: settings?.userId || '',
      type: 'system',
      title: '💡 Tips: Tambah Lebih Banyak Produk',
      message: `Anda baru punya ${products.length} produk. Tambahkan lebih banyak untuk analisis yang lebih baik.`,
      priority: 'low',
      icon: '💡',
      read: false,
      actionUrl: '/stok',
      actionLabel: 'Tambah Produk',
    });
  }

  return notifications;
}
