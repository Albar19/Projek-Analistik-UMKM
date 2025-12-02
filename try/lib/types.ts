// Types untuk Dashboard Penjualan

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  date: string; // Format: YYYY-MM-DD
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
}

export interface DailySales {
  date: string;
  total: number;
  quantity: number;
  transactions: number;
  [key: string]: string | number;
}

export interface ProductSales {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  averageDaily: number;
}

export interface SalesInsight {
  type: 'increase' | 'decrease' | 'stable' | 'anomaly' | 'info';
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  date?: string;
}

export interface SalesPrediction {
  period: 'daily' | 'weekly' | 'monthly';
  predictedValue: number;
  confidenceLevel: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  productPredictions?: {
    productId: string;
    productName: string;
    predictedQuantity: number;
    confidence: number;
  }[];
}

export interface StockAnalysis {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilEmpty: number;
  status: 'critical' | 'low' | 'normal' | 'overstock';
  recommendedRestock: number;
  profitMargin: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'admin' | 'staff' | 'viewer';
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface BusinessSettings {
  businessName: string;
  businessType: 'retail' | 'wholesale' | 'fnb' | 'service' | 'other';
  storeName?: string;
  storeAddress?: string;
  timezone: string;
  currency: string;
  categories?: string[];
  units?: string[];
  lowStockThreshold: number;
  minStockAlert?: number;
  nvidiaApiKey: string;
  enableNotifications: boolean;
  enableAutoReports: boolean;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  emailNotifications?: boolean;
  notificationEmail?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ReportData {
  period: string;
  totalSales: number;
  totalQuantity: number;
  topProducts: ProductSales[];
  insights: SalesInsight[];
  predictions: SalesPrediction;
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'custom';
export type CategoryFilter = string | 'all';
