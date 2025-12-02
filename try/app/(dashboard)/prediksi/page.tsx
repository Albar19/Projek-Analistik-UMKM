'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { calculateDailySales, calculateProductSales } from '@/lib/data';
import {
  formatCurrency,
  formatNumber,
  generatePrediction,
  filterSalesByDateRange,
  getDateRange,
} from '@/lib/utils';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { SalesLineChart, MultiLineChart } from '@/components/charts/Charts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

type PredictionPeriod = 'daily' | 'weekly' | 'monthly';

export default function PrediksiPage() {
  const { sales } = useStore();
  const [period, setPeriod] = useState<PredictionPeriod>('weekly');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate data
  const { start, end } = getDateRange(30);
  const currentSales = filterSalesByDateRange(sales, start, end);
  const dailySales = useMemo(() => calculateDailySales(currentSales), [currentSales]);
  const productSales = useMemo(() => calculateProductSales(currentSales, 30), [currentSales]);

  // Generate predictions
  const prediction = useMemo(
    () => generatePrediction(dailySales, productSales, period),
    [dailySales, productSales, period]
  );

  // Trend icon
  const TrendIcon =
    prediction.trend === 'up'
      ? TrendingUp
      : prediction.trend === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    prediction.trend === 'up'
      ? 'text-green-600'
      : prediction.trend === 'down'
      ? 'text-red-600'
      : 'text-slate-600';

  const trendBg =
    prediction.trend === 'up'
      ? 'bg-green-100'
      : prediction.trend === 'down'
      ? 'bg-red-100'
      : 'bg-slate-100';

  // Prepare chart data with prediction
  const chartData = useMemo(() => {
    const actualData = dailySales.map((d) => ({
      date: d.date,
      actual: d.total,
      predicted: null as number | null,
    }));

    // Add prediction points
    const lastDate = new Date(dailySales[dailySales.length - 1]?.date || new Date());
    const avgDaily = prediction.predictedValue / (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30);
    
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      actualData.push({
        date: nextDate.toISOString().split('T')[0],
        actual: null as unknown as number,
        predicted: avgDaily * (1 + (prediction.trendPercentage / 100) * (i / 7)),
      });
    }

    return actualData;
  }, [dailySales, prediction, period]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🔮 Prediksi Penjualan</h1>
          <p className="text-slate-500 mt-1">AI memprediksi penjualan berdasarkan data historis</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'daily', label: 'Harian' },
              { value: 'weekly', label: 'Mingguan' },
              { value: 'monthly', label: 'Bulanan' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value as PredictionPeriod)}
            className="w-40"
          />
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Prediction Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-blue-200 text-sm">
                Prediksi {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : 'Bulanan'}
              </span>
            </div>
            <p className="text-4xl font-bold">{formatCurrency(prediction.predictedValue)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                  prediction.trend === 'up'
                    ? 'bg-green-500/30 text-green-100'
                    : prediction.trend === 'down'
                    ? 'bg-red-500/30 text-red-100'
                    : 'bg-white/20 text-white'
                }`}
              >
                <TrendIcon className="w-4 h-4" />
                {prediction.trendPercentage > 0 ? '+' : ''}
                {prediction.trendPercentage.toFixed(1)}%
              </span>
              <span className="text-blue-200 text-sm">vs periode sebelumnya</span>
            </div>
          </div>

          {/* Confidence Level */}
          <div className="bg-white/10 rounded-xl p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm text-blue-200">Tingkat Kepercayaan</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{prediction.confidenceLevel.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${prediction.confidenceLevel}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Prediction Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Grafik Prediksi</h2>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-slate-600">Aktual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-slate-600">Prediksi</span>
            </div>
          </div>
        </div>
        <MultiLineChart
          data={chartData}
          lines={[
            { dataKey: 'actual', name: 'Aktual', color: '#3B82F6' },
            { dataKey: 'predicted', name: 'Prediksi', color: '#10B981' },
          ]}
          xAxisKey="date"
          height={350}
        />
      </Card>

      {/* Product Predictions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Prediksi per Produk</h2>
        </div>
        <div className="space-y-4">
          {prediction.productPredictions?.map((product, idx) => (
            <div key={product.productId} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      idx === 0
                        ? 'bg-blue-600'
                        : idx === 1
                        ? 'bg-blue-500'
                        : idx === 2
                        ? 'bg-blue-400'
                        : 'bg-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{product.productName}</p>
                    <p className="text-sm text-slate-500">
                      Prediksi: {product.predictedQuantity} unit
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    product.confidence >= 75
                      ? 'success'
                      : product.confidence >= 60
                      ? 'warning'
                      : 'default'
                  }
                >
                  {product.confidence.toFixed(0)}% yakin
                </Badge>
              </div>
              <ProgressBar
                value={product.confidence}
                color={
                  product.confidence >= 75
                    ? 'green'
                    : product.confidence >= 60
                    ? 'yellow'
                    : 'blue'
                }
                showPercentage={false}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className={`inline-flex p-4 rounded-full ${trendBg} mb-3`}>
              <TrendIcon className={`w-8 h-8 ${trendColor}`} />
            </div>
            <h3 className="font-semibold text-slate-900">Tren Penjualan</h3>
            <p className="text-2xl font-bold mt-1 capitalize">
              {prediction.trend === 'up' ? 'Naik' : prediction.trend === 'down' ? 'Turun' : 'Stabil'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {Math.abs(prediction.trendPercentage).toFixed(1)}%{' '}
              {prediction.trend === 'up' ? 'kenaikan' : prediction.trend === 'down' ? 'penurunan' : ''}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-100 mb-3">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Akurasi Model</h3>
            <p className="text-2xl font-bold mt-1">{prediction.confidenceLevel.toFixed(0)}%</p>
            <p className="text-sm text-slate-500 mt-1">Tingkat kepercayaan</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-purple-100 mb-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Data Dianalisis</h3>
            <p className="text-2xl font-bold mt-1">{dailySales.length}</p>
            <p className="text-sm text-slate-500 mt-1">Hari data historis</p>
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="bg-yellow-50 border-yellow-200">
        <div className="flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Catatan Penting</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Prediksi ini dibuat berdasarkan data penjualan historis yang Anda input secara manual.
              Akurasi prediksi akan meningkat seiring bertambahnya data. Faktor eksternal seperti
              musim, promo, dan tren pasar belum diperhitungkan.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
