'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { calculateDailySales, calculateProductSales } from '@/lib/data';
import {
  formatCurrency,
  generateInsights,
  generateWeeklySummary,
  filterSalesByDateRange,
  getDateRange,
  parseNaturalQuery,
  formatNumber,
} from '@/lib/utils';
import { Card, InsightCard, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { SalesAreaChart } from '@/components/charts/Charts';
import { Bot, Send, Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

export default function AnalisisPage() {
  const { sales, products } = useStore();
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate data
  const { start, end } = getDateRange(30);
  const currentSales = filterSalesByDateRange(sales, start, end);
  const dailySales = useMemo(() => calculateDailySales(currentSales), [currentSales]);
  const productSales = useMemo(() => calculateProductSales(currentSales, 30), [currentSales]);

  // Previous period for comparison
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - 30);
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousSales = filterSalesByDateRange(sales, previousStart, previousEnd);
  const previousDailySales = useMemo(() => calculateDailySales(previousSales), [previousSales]);

  // AI Insights
  const insights = useMemo(
    () => generateInsights(dailySales, productSales, previousDailySales),
    [dailySales, productSales, previousDailySales]
  );

  // Weekly summary
  const weeklySummary = useMemo(
    () => generateWeeklySummary(dailySales.slice(-7), productSales),
    [dailySales, productSales]
  );

  // Anomaly detection
  const anomalies = insights.filter((i) => i.type === 'anomaly');

  // Chat-to-Data handler
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    setIsLoading(true);
    const query = parseNaturalQuery(chatInput);

    // Simulate AI response based on query type
    setTimeout(() => {
      let response = '';

      switch (query.type) {
        case 'daily_sales':
          const todaySales = dailySales[dailySales.length - 1];
          response = `📊 Penjualan Hari Ini:\n• Total: ${formatCurrency(todaySales?.total || 0)}\n• Unit Terjual: ${todaySales?.quantity || 0} unit\n• Transaksi: ${todaySales?.transactions || 0} transaksi`;
          break;
        case 'weekly_sales':
          const weekSales = dailySales.slice(-7);
          const weekTotal = weekSales.reduce((sum, d) => sum + d.total, 0);
          response = `📊 Penjualan Minggu Ini:\n• Total: ${formatCurrency(weekTotal)}\n• Rata-rata Harian: ${formatCurrency(weekTotal / 7)}\n• Total Unit: ${weekSales.reduce((sum, d) => sum + d.quantity, 0)} unit`;
          break;
        case 'monthly_sales':
          const monthTotal = dailySales.reduce((sum, d) => sum + d.total, 0);
          response = `📊 Penjualan Bulan Ini:\n• Total: ${formatCurrency(monthTotal)}\n• Rata-rata Harian: ${formatCurrency(monthTotal / 30)}\n• Total Unit: ${dailySales.reduce((sum, d) => sum + d.quantity, 0)} unit`;
          break;
        case 'top_products':
          response = `🏆 Top 5 Produk Terlaris:\n${productSales
            .slice(0, 5)
            .map((p, i) => `${i + 1}. ${p.productName}: ${p.totalQuantity} unit (${formatCurrency(p.totalRevenue)})`)
            .join('\n')}`;
          break;
        case 'stock_status':
          const lowStock = products.filter((p) => p.stock <= p.minStock);
          response = `📦 Status Stok:\n• Total Produk: ${products.length}\n• Stok Rendah: ${lowStock.length} produk\n${lowStock.length > 0 ? `\nProduk dengan stok rendah:\n${lowStock.map((p) => `• ${p.name}: ${p.stock} ${p.unit}`).join('\n')}` : ''}`;
          break;
        case 'prediction':
          const avgDaily = dailySales.reduce((sum, d) => sum + d.total, 0) / dailySales.length;
          response = `🔮 Prediksi Penjualan:\n• Prediksi Harian: ${formatCurrency(avgDaily)}\n• Prediksi Mingguan: ${formatCurrency(avgDaily * 7)}\n• Prediksi Bulanan: ${formatCurrency(avgDaily * 30)}`;
          break;
        default:
          response = `Saya dapat menjawab pertanyaan tentang:\n• Penjualan hari ini/minggu ini/bulan ini\n• Produk terlaris\n• Status stok\n• Prediksi penjualan\n\nCoba tanya: "Berapa penjualan minggu ini?"`;
      }

      setChatResponse(response);
      setIsLoading(false);
    }, 1000);

    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🤖 Analisis AI</h1>
        <p className="text-slate-500 mt-1">Insight otomatis berdasarkan data penjualan Anda</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Insight Positif</p>
              <p className="text-2xl font-bold text-green-800">
                {insights.filter((i) => i.type === 'increase').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-700">Perlu Perhatian</p>
              <p className="text-2xl font-bold text-red-800">
                {insights.filter((i) => i.type === 'decrease').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-yellow-700">Anomali Terdeteksi</p>
              <p className="text-2xl font-bold text-yellow-800">{anomalies.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Insight Otomatis</h2>
            </div>
            <Badge variant="info">{insights.length} insight</Badge>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                type={insight.type}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Ringkasan Mingguan</h2>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
              {weeklySummary}
            </pre>
          </div>
          <SalesAreaChart
            data={dailySales.slice(-7)}
            dataKey="total"
            xAxisKey="date"
            height={200}
          />
        </Card>
      </div>

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-slate-900">Deteksi Anomali</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((anomaly, idx) => (
              <InsightCard
                key={idx}
                type="anomaly"
                title={anomaly.title}
                description={anomaly.description}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Chat to Data */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Chat-to-Data</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Tanya apa saja tentang data penjualan Anda menggunakan bahasa natural
        </p>

        {/* Chat Response */}
        {chatResponse && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans flex-1">
                {chatResponse}
              </pre>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="flex gap-3">
          <Input
            placeholder="Contoh: Berapa penjualan minggu ini?"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
            className="flex-1"
          />
          <Button onClick={handleChatSubmit} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            'Penjualan hari ini',
            'Penjualan minggu ini',
            'Produk terlaris',
            'Status stok',
            'Prediksi penjualan',
          ].map((q) => (
            <button
              key={q}
              onClick={() => {
                setChatInput(q);
              }}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
