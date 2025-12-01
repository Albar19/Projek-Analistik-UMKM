'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { calculateProductSales } from '@/lib/data';
import {
  formatCurrency,
  formatNumber,
  analyzeStock,
  filterSalesByDateRange,
  getDateRange,
} from '@/lib/utils';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { SalesBarChart } from '@/components/charts/Charts';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  ArrowUpCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { Select } from '@/components/ui/Input';

type StockFilter = 'all' | 'critical' | 'low' | 'normal' | 'overstock';

export default function StokPage() {
  const { products, sales } = useStore();
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Calculate data
  const { start, end } = getDateRange(30);
  const currentSales = filterSalesByDateRange(sales, start, end);
  const productSales = useMemo(() => calculateProductSales(currentSales, 30), [currentSales]);

  // Analyze stock
  const stockAnalysis = useMemo(
    () => analyzeStock(products, productSales),
    [products, productSales]
  );

  // Filter stock
  const filteredStock =
    stockFilter === 'all'
      ? stockAnalysis
      : stockAnalysis.filter((s) => s.status === stockFilter);

  // Stock counts
  const criticalCount = stockAnalysis.filter((s) => s.status === 'critical').length;
  const lowCount = stockAnalysis.filter((s) => s.status === 'low').length;
  const normalCount = stockAnalysis.filter((s) => s.status === 'normal').length;
  const overstockCount = stockAnalysis.filter((s) => s.status === 'overstock').length;

  // Top sellers
  const topSellers = productSales.slice(0, 5);
  const slowMovers = productSales.slice(-5).reverse();

  // Chart data - profit margin
  const profitChartData = stockAnalysis.slice(0, 8).map((s) => ({
    name: s.productName.substring(0, 15),
    margin: s.profitMargin,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overstock':
        return <ArrowUpCircle className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="danger">Kritis</Badge>;
      case 'low':
        return <Badge variant="warning">Rendah</Badge>;
      case 'normal':
        return <Badge variant="success">Normal</Badge>;
      case 'overstock':
        return <Badge variant="info">Berlebih</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📦 Analisis Stok & Produk</h1>
          <p className="text-slate-500 mt-1">Monitor stok dan performa produk Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'critical', label: 'Kritis' },
              { value: 'low', label: 'Rendah' },
              { value: 'normal', label: 'Normal' },
              { value: 'overstock', label: 'Berlebih' },
            ]}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="w-40"
          />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stock Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            stockFilter === 'critical' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => setStockFilter(stockFilter === 'critical' ? 'all' : 'critical')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kritis</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            stockFilter === 'low' ? 'ring-2 ring-yellow-500' : ''
          }`}
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Rendah</p>
              <p className="text-2xl font-bold text-yellow-600">{lowCount}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            stockFilter === 'normal' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setStockFilter(stockFilter === 'normal' ? 'all' : 'normal')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Normal</p>
              <p className="text-2xl font-bold text-green-600">{normalCount}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            stockFilter === 'overstock' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setStockFilter(stockFilter === 'overstock' ? 'all' : 'overstock')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowUpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Berlebih</p>
              <p className="text-2xl font-bold text-blue-600">{overstockCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Status Stok Produk</h2>
          <Badge variant="default">{filteredStock.length} produk</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Produk</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Stok</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Rata-rata/Hari
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Habis Dalam
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Rekomendasi Restock
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Margin Profit
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((stock) => (
                <tr key={stock.productId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(stock.status)}
                      <span className="font-medium text-slate-900">{stock.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{stock.currentStock} unit</td>
                  <td className="px-4 py-3">{getStatusBadge(stock.status)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {stock.averageDailySales.toFixed(1)} unit
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${
                        stock.daysUntilEmpty <= 7
                          ? 'text-red-600'
                          : stock.daysUntilEmpty <= 14
                          ? 'text-yellow-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {stock.daysUntilEmpty > 100 ? '100+ hari' : `${stock.daysUntilEmpty} hari`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {stock.recommendedRestock > 0 ? (
                      <span className="text-blue-600 font-medium">
                        +{stock.recommendedRestock} unit
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={stock.profitMargin}
                        max={100}
                        color={
                          stock.profitMargin >= 40
                            ? 'green'
                            : stock.profitMargin >= 25
                            ? 'yellow'
                            : 'red'
                        }
                        showPercentage={false}
                      />
                      <span className="text-sm font-medium text-slate-600">
                        {stock.profitMargin.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Sellers & Slow Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-green-600 rotate-180" />
            <h2 className="text-lg font-semibold text-slate-900">Produk Terlaris</h2>
          </div>
          <div className="space-y-3">
            {topSellers.map((product, idx) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{product.productName}</p>
                    <p className="text-sm text-slate-500">
                      {product.totalQuantity} unit | {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>
                <Badge variant="success">{product.averageDaily.toFixed(1)}/hari</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Slow Movers */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-900">Produk Lambat Laku</h2>
          </div>
          <div className="space-y-3">
            {slowMovers.map((product, idx) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{product.productName}</p>
                    <p className="text-sm text-slate-500">
                      {product.totalQuantity} unit | {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>
                <Badge variant="danger">{product.averageDaily.toFixed(1)}/hari</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Profit Margin Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 Margin Profit per Produk</h2>
        <SalesBarChart
          data={profitChartData}
          dataKey="margin"
          xAxisKey="name"
          color="#10B981"
          height={280}
        />
      </Card>

      {/* Restock Recommendations */}
      {stockAnalysis.filter((s) => s.recommendedRestock > 0).length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Rekomendasi Restock</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockAnalysis
              .filter((s) => s.recommendedRestock > 0)
              .slice(0, 6)
              .map((stock) => (
                <div key={stock.productId} className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-medium text-slate-900">{stock.productName}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Stok saat ini: {stock.currentStock} unit
                  </p>
                  <p className="text-blue-600 font-semibold mt-2">
                    Rekomendasi: +{stock.recommendedRestock} unit
                  </p>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
