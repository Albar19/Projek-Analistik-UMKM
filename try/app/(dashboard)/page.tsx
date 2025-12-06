'use client';

import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { calculateDailySales, calculateProductSales } from '@/lib/data';
import {
  formatCurrency,
  formatNumber,
  calculatePercentageChange,
  generateInsights,
  filterSalesByDateRange,
  getDateRange,
  generateNotifications,
} from '@/lib/utils';
import { Card, StatCard, InsightCard, Badge } from '@/components/ui';
import { SalesLineChart, SalesBarChart, ProductPieChart } from '@/components/charts/Charts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Calendar,
  Download,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

type TimeRange = '7' | '14' | '30';

export default function DashboardPage() {
  const { sales, products, addNotification, notifications, notificationSettings } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('7');
  const [showNotifications, setShowNotifications] = useState(false);

  const days = parseInt(timeRange);

  // Generate notifications on dashboard load
  useEffect(() => {
    if (products.length > 0) {
      const newNotifications = generateNotifications(products, sales, notificationSettings);
      
      // Add all new notifications
      newNotifications.forEach((notif) => {
        const exists = notifications.some(
          (n) =>
            n.type === notif.type &&
            n.metadata?.productId === notif.metadata?.productId &&
            n.message === notif.message
        );
        if (!exists) {
          addNotification(notif);
        }
      });
    }
  }, [products.length, sales.length]);

  // Calculate date ranges
  const { currentSales, previousSales } = useMemo(() => {
    const { start: currentStart, end: currentEnd } = getDateRange(days);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);

    return {
      currentSales: filterSalesByDateRange(sales, currentStart, currentEnd),
      previousSales: filterSalesByDateRange(sales, previousStart, previousEnd),
    };
  }, [sales, days]);

  // Calculate metrics
  const dailySales = useMemo(() => calculateDailySales(currentSales), [currentSales]);
  const previousDailySales = useMemo(() => calculateDailySales(previousSales), [previousSales]);
  const productSales = useMemo(() => calculateProductSales(currentSales, days), [currentSales, days]);

  // Summary stats
  const totalRevenue = dailySales.reduce((sum, d) => sum + d.total, 0);
  const previousRevenue = previousDailySales.reduce((sum, d) => sum + d.total, 0);
  const revenueChange = calculatePercentageChange(totalRevenue, previousRevenue);

  const totalQuantity = dailySales.reduce((sum, d) => sum + d.quantity, 0);
  const previousQuantity = previousDailySales.reduce((sum, d) => sum + d.quantity, 0);
  const quantityChange = calculatePercentageChange(totalQuantity, previousQuantity);

  const totalTransactions = dailySales.reduce((sum, d) => sum + d.transactions, 0);
  const previousTransactions = previousDailySales.reduce((sum, d) => sum + d.transactions, 0);
  const transactionsChange = calculatePercentageChange(totalTransactions, previousTransactions);

  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const previousAvgOrder = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;
  const avgOrderChange = calculatePercentageChange(avgOrderValue, previousAvgOrder);

  // AI Insights
  const insights = useMemo(
    () => generateInsights(dailySales, productSales, previousDailySales),
    [dailySales, productSales, previousDailySales]
  );

  // Chart data for pie chart
  const pieChartData = productSales.slice(0, 5).map((p) => ({
    name: p.productName,
    value: p.totalRevenue,
  }));

  // Notifications (sales changes from insights)
  const insightNotifications = insights.filter(
    (i) => i.type === 'increase' || i.type === 'decrease' || i.type === 'anomaly'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📊 Dashboard Penjualan</h1>
          <p className="text-slate-500 mt-1">Ringkasan performa penjualan toko Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '7', label: '7 Hari Terakhir' },
              { value: '14', label: '14 Hari Terakhir' },
              { value: '30', label: '30 Hari Terakhir' },
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="w-44"
          />
          <div className="relative">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell size={18} />
              {insightNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {insightNotifications.length}
                </span>
              )}
            </Button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Notifikasi</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {insightNotifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">Tidak ada notifikasi</p>
                  ) : (
                    insightNotifications.map((notif, idx) => (
                      <div key={idx} className="p-4 border-b border-slate-100 last:border-0">
                        <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="md">
            <Download size={18} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Penjualan"
          value={formatCurrency(totalRevenue)}
          change={revenueChange}
          icon={DollarSign}
          trend={revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Unit Terjual"
          value={formatNumber(totalQuantity)}
          change={quantityChange}
          icon={ShoppingCart}
          trend={quantityChange > 0 ? 'up' : quantityChange < 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Transaksi"
          value={formatNumber(totalTransactions)}
          change={transactionsChange}
          icon={Package}
          trend={transactionsChange > 0 ? 'up' : transactionsChange < 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Rata-rata Order"
          value={formatCurrency(avgOrderValue)}
          change={avgOrderChange}
          icon={TrendingUp}
          trend={avgOrderChange > 0 ? 'up' : avgOrderChange < 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Tren Penjualan Harian</h2>
            <Badge variant="info">
              <Calendar size={14} className="mr-1" />
              {days} Hari
            </Badge>
          </div>
          <SalesLineChart
            data={dailySales}
            dataKey="total"
            xAxisKey="date"
            height={320}
          />
        </Card>

        {/* Top Products Pie Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Produk Terlaris</h2>
          <ProductPieChart data={pieChartData} height={320} />
        </Card>
      </div>

      {/* AI Insights & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🤖 Insight AI</h2>
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight, idx) => (
              <InsightCard
                key={idx}
                type={insight.type}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </Card>

        {/* Top Products Table */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">📦 Performa Produk</h2>
          <div className="space-y-3">
            {productSales.slice(0, 5).map((product, idx) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      idx === 0
                        ? 'bg-yellow-500'
                        : idx === 1
                        ? 'bg-slate-400'
                        : idx === 2
                        ? 'bg-amber-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{product.productName}</p>
                    <p className="text-sm text-slate-500">{product.totalQuantity} unit</p>
                  </div>
                </div>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(product.totalRevenue)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sales by Day Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 Penjualan per Hari</h2>
        <SalesBarChart
          data={dailySales}
          dataKey="total"
          xAxisKey="date"
          height={280}
        />
      </Card>
    </div>
  );
}
