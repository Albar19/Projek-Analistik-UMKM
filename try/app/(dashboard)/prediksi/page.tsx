'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { calculateDailySales, calculateProductSales } from '@/lib/data';
import {
  formatCurrency,
  formatNumber,
  generatePrediction,
  generateRecommendations,
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
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  PackageOpen,
} from 'lucide-react';

type PredictionPeriod = 'daily' | 'weekly' | 'monthly';

export default function PrediksiPage() {
  const { sales, products } = useStore();
  const [period, setPeriod] = useState<PredictionPeriod>('weekly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

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

  // Generate recommendations
  const recommendations = useMemo(
    () => generateRecommendations(prediction, products, productSales),
    [prediction, products, productSales]
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴 Prioritas Tinggi';
      case 'medium':
        return '🟡 Prioritas Sedang';
      case 'low':
        return '🟢 Prioritas Rendah';
      default:
        return 'Prioritas';
    }
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

      {/* AI Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">💡 Rekomendasi AI</h2>
          <Badge variant="default" className="ml-auto">
            {recommendations.length} saran
          </Badge>
        </div>

        {recommendations.length === 0 ? (
          <Card className="text-center py-8">
            <PackageOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600">Tidak ada rekomendasi saat ini. Data yang tersedia masih terbatas.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() =>
                  setExpandedRecommendation(
                    expandedRecommendation === rec.id ? null : rec.id
                  )
                }
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${getPriorityColor(
                  rec.priority
                )}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{rec.icon}</span>
                      <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                      <span className="text-xs px-2 py-1 bg-white/50 rounded-full whitespace-nowrap">
                        {getPriorityLabel(rec.priority)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{rec.description}</p>

                    {expandedRecommendation === rec.id && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">
                            📋 Langkah yang Dapat Dilakukan:
                          </h4>
                          <ul className="space-y-1">
                            {rec.actionItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t pt-2">
                          <h4 className="text-sm font-semibold text-slate-900 mb-1">
                            📈 Expected Impact:
                          </h4>
                          <p className="text-sm text-slate-700">{rec.expectedImpact}</p>
                        </div>

                        {rec.relatedProducts && rec.relatedProducts.length > 0 && (
                          <div className="border-t pt-2">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">
                              📦 Produk Terkait:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.relatedProducts.map((prod) => (
                                <span
                                  key={prod.productId}
                                  className="text-xs bg-white/50 px-2 py-1 rounded-full"
                                >
                                  {prod.productName} ({prod.relevance.toFixed(0)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center shrink-0">
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        expandedRecommendation === rec.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
