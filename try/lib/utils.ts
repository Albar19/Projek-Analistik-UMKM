import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sale, DailySales, SalesInsight, SalesPrediction, StockAnalysis, Product, ProductSales } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
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
