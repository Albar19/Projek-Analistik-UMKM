'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { calculateDailySales, calculateProductSales } from '@/lib/data';
import {
  formatCurrency,
  formatNumber,
  generateInsights,
  generatePrediction,
  analyzeStock,
  generateWeeklySummary,
  filterSalesByDateRange,
  getDateRange,
} from '@/lib/utils';
import { Card, Badge, InsightCard } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { SalesLineChart, ProductPieChart } from '@/components/charts/Charts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  FileText,
  Download,
  Mail,
  Calendar,
  TrendingUp,
  Package,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function LaporanPage() {
  const { sales, products, settings } = useStore();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailTarget, setEmailTarget] = useState('');

  // Calculate data
  const { start, end } = getDateRange(30);
  const currentSales = filterSalesByDateRange(sales, start, end);
  const dailySales = useMemo(() => calculateDailySales(currentSales), [currentSales]);
  const productSales = useMemo(() => calculateProductSales(currentSales, 30), [currentSales]);

  // Previous period
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - 30);
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousSales = filterSalesByDateRange(sales, previousStart, previousEnd);
  const previousDailySales = useMemo(() => calculateDailySales(previousSales), [previousSales]);

  // Analysis
  const insights = useMemo(
    () => generateInsights(dailySales, productSales, previousDailySales),
    [dailySales, productSales, previousDailySales]
  );
  const prediction = useMemo(
    () => generatePrediction(dailySales, productSales, 'weekly'),
    [dailySales, productSales]
  );
  const stockAnalysis = useMemo(
    () => analyzeStock(products, productSales),
    [products, productSales]
  );
  const weeklySummary = useMemo(
    () => generateWeeklySummary(dailySales.slice(-7), productSales),
    [dailySales, productSales]
  );

  // Summary stats
  const totalRevenue = dailySales.reduce((sum, d) => sum + d.total, 0);
  const totalQuantity = dailySales.reduce((sum, d) => sum + d.quantity, 0);
  const lowStockCount = stockAnalysis.filter((s) => s.status === 'critical' || s.status === 'low').length;

  // Pie chart data
  const pieData = productSales.slice(0, 5).map((p) => ({
    name: p.productName,
    value: p.totalRevenue,
  }));

  // Export PDF-like report (Excel with formatted data)
  const handleExportReport = () => {
    const reportData = [
      ['LAPORAN PENJUALAN'],
      [`Toko: ${settings.storeName}`],
      [`Periode: ${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`],
      [''],
      ['RINGKASAN'],
      ['Total Penjualan', formatCurrency(totalRevenue)],
      ['Total Unit Terjual', totalQuantity],
      ['Rata-rata Harian', formatCurrency(totalRevenue / 30)],
      [''],
      ['TOP 5 PRODUK TERLARIS'],
      ['Produk', 'Qty', 'Revenue'],
      ...productSales.slice(0, 5).map((p) => [p.productName, p.totalQuantity, formatCurrency(p.totalRevenue)]),
      [''],
      ['PREDIKSI MINGGU DEPAN'],
      ['Prediksi Penjualan', formatCurrency(prediction.predictedValue)],
      ['Tingkat Kepercayaan', `${prediction.confidenceLevel.toFixed(0)}%`],
      ['Tren', prediction.trend === 'up' ? 'Naik' : prediction.trend === 'down' ? 'Turun' : 'Stabil'],
      [''],
      ['STOK PERLU PERHATIAN'],
      ['Produk', 'Stok', 'Status'],
      ...stockAnalysis
        .filter((s) => s.status === 'critical' || s.status === 'low')
        .map((s) => [s.productName, s.currentStock, s.status === 'critical' ? 'Kritis' : 'Rendah']),
      [''],
      ['INSIGHT AI'],
      ...insights.map((i) => [i.title, i.description]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

    // Also add detailed sales data
    const salesData = dailySales.map((d) => ({
      Tanggal: d.date,
      'Total Penjualan': d.total,
      'Unit Terjual': d.quantity,
      Transaksi: d.transactions,
    }));
    const wsSales = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Detail Penjualan');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `laporan-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Send report via email
  const handleSendEmail = async () => {
    // Prioritas: 1. Email yang diinput manual, 2. Email dari Pengaturan
    const recipientEmail = emailTarget || settings.notificationEmail;
    
    if (!recipientEmail) {
      alert('❌ Email tujuan belum diatur!\n\nSilakan atur email notifikasi di halaman Pengaturan, atau masukkan email di kolom input.');
      return;
    }

    setIsEmailSending(true);
    try {
      // Generate HTML report
      const reportHTML = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">
            📮 Laporan Penjualan
          </h2>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Toko:</strong> ${settings.businessName || settings.storeName || 'Toko Saya'}</p>
            <p><strong>Periode:</strong> ${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}</p>
          </div>

          <h3 style="color: #1e40af; margin-top: 20px;">📊 Ringkasan</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #e0e7ff;">
              <td style="padding: 10px; border: 1px solid #c7d2fe;"><strong>Total Penjualan</strong></td>
              <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;"><strong>${formatCurrency(totalRevenue)}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #c7d2fe;">Total Unit Terjual</td>
              <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${formatNumber(totalQuantity)}</td>
            </tr>
            <tr style="background-color: #f0f9ff;">
              <td style="padding: 10px; border: 1px solid #c7d2fe;">Rata-rata Harian</td>
              <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${formatCurrency(totalRevenue / 30)}</td>
            </tr>
          </table>

          <h3 style="color: #1e40af; margin-top: 20px;">🏆 Top 5 Produk Terlaris</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #e0e7ff;">
                <th style="padding: 10px; border: 1px solid #c7d2fe; text-align: left;">Produk</th>
                <th style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">Qty</th>
                <th style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${productSales.slice(0, 5).map((p) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #c7d2fe;">${p.productName}</td>
                  <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${formatNumber(p.totalQuantity)}</td>
                  <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${formatCurrency(p.totalRevenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 style="color: #1e40af; margin-top: 20px;">📈 Prediksi Minggu Depan</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f0f9ff;">
              <td style="padding: 10px; border: 1px solid #c7d2fe;">Prediksi Penjualan</td>
              <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${formatCurrency(prediction.predictedValue)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #c7d2fe;">Tingkat Kepercayaan</td>
              <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${prediction.confidenceLevel.toFixed(0)}%</td>
            </tr>
            <tr style="background-color: #f0f9ff;">
              <td style="padding: 10px; border: 1px solid #c7d2fe;">Tren</td>
              <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${prediction.trend === 'up' ? '📈 Naik' : prediction.trend === 'down' ? '📉 Turun' : '➡️ Stabil'}</td>
            </tr>
          </table>

          <h3 style="color: #1e40af; margin-top: 20px;">⚠️ Stok Perlu Perhatian</h3>
          ${stockAnalysis.filter((s) => s.status === 'critical' || s.status === 'low').length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #e0e7ff;">
                  <th style="padding: 10px; border: 1px solid #c7d2fe; text-align: left;">Produk</th>
                  <th style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">Stok</th>
                  <th style="padding: 10px; border: 1px solid #c7d2fe; text-align: left;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${stockAnalysis
                  .filter((s) => s.status === 'critical' || s.status === 'low')
                  .map((s) => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #c7d2fe;">${s.productName}</td>
                      <td style="padding: 10px; border: 1px solid #c7d2fe; text-align: right;">${s.currentStock}</td>
                      <td style="padding: 10px; border: 1px solid #c7d2fe; color: ${s.status === 'critical' ? '#dc2626' : '#ea580c'}; font-weight: bold;">
                        ${s.status === 'critical' ? '🔴 Kritis' : '🟠 Rendah'}
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #10b981; font-weight: bold;">✅ Semua stok dalam kondisi baik</p>'}

          <h3 style="color: #1e40af; margin-top: 20px;">💡 Insight AI</h3>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            ${insights.map((i) => `
              <div style="margin-bottom: 10px;">
                <strong>${i.title}</strong>
                <p style="margin: 5px 0; color: #555;">${i.description}</p>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
            <p>Laporan ini dikirim secara otomatis oleh sistem Analistik Penjualan</p>
            <p>Waktu: ${new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      `;

      // Call email API
      const response = await fetch('/api/email/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          reportHTML,
          reportSubject: `Laporan Penjualan - ${settings.businessName || settings.storeName || 'Toko Saya'} (${new Date().toLocaleDateString('id-ID')})`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message
        if (data.details) {
          throw new Error(`${data.error}: ${data.details}`);
        }
        throw new Error(data.error || 'Gagal mengirim email');
      }

      alert(`✅ Email berhasil dikirim ke ${recipientEmail}`);
      setEmailTarget('');
    } catch (error) {
      console.error('Email error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kesalahan tidak diketahui';
      alert(`❌ Gagal mengirim email:\n\n${errorMessage}\n\nPastikan EMAIL_USER dan EMAIL_PASSWORD sudah dikonfigurasi di file .env`);
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📮 Laporan Otomatis</h1>
          <p className="text-slate-500 mt-1">
            Kirim ke: <span className="font-medium text-blue-600">{settings.notificationEmail || 'Belum diatur di Pengaturan'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder={settings.notificationEmail || "Atur di Pengaturan..."}
              value={emailTarget}
              onChange={(e) => setEmailTarget(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleSendEmail} disabled={isEmailSending}>
              <Mail className="w-4 h-4 mr-2" />
              {isEmailSending ? 'Mengirim...' : 'Kirim'}
            </Button>
          </div>
          <Button onClick={handleExportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <Card className="bg-white border-2 border-slate-200">
        {/* Report Header */}
        <div className="border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">LAPORAN PENJUALAN</h2>
              <p className="text-slate-500 mt-1">{settings.storeName}</p>
            </div>
            <div className="text-right">
              <Badge variant="info" className="mb-2">
                <Calendar className="w-3 h-3 mr-1" />
                30 Hari Terakhir
              </Badge>
              <p className="text-sm text-slate-500">
                {start.toLocaleDateString('id-ID')} - {end.toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Penjualan</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Unit Terjual</p>
            <p className="text-2xl font-bold text-green-900">{formatNumber(totalQuantity)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Rata-rata Harian</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalRevenue / 30)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600">Stok Rendah</p>
            <p className="text-2xl font-bold text-orange-900">{lowStockCount} produk</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Tren Penjualan
            </h3>
            <SalesLineChart data={dailySales} dataKey="total" xAxisKey="date" height={250} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600" />
              Distribusi Produk
            </h3>
            <ProductPieChart data={pieData} height={250} />
          </div>
        </div>

        {/* Top Products */}
        <div className="mb-8">
          <h3 className="font-semibold text-slate-900 mb-4">🏆 Top 5 Produk Terlaris</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">#</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Produk</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Qty</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Revenue</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Avg/Hari</th>
                </tr>
              </thead>
              <tbody>
                {productSales.slice(0, 5).map((product, idx) => (
                  <tr key={product.productId} className="border-b border-slate-100">
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
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
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-slate-900">{product.productName}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{product.totalQuantity}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{formatCurrency(product.totalRevenue)}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{product.averageDaily.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prediction */}
        <div className="mb-8">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Prediksi Minggu Depan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-80">Prediksi Penjualan</p>
              <p className="text-2xl font-bold">{formatCurrency(prediction.predictedValue)}</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-sm text-slate-500">Tingkat Kepercayaan</p>
              <p className="text-2xl font-bold text-slate-900">{prediction.confidenceLevel.toFixed(0)}%</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-sm text-slate-500">Tren</p>
              <p
                className={`text-2xl font-bold capitalize ${
                  prediction.trend === 'up'
                    ? 'text-green-600'
                    : prediction.trend === 'down'
                    ? 'text-red-600'
                    : 'text-slate-600'
                }`}
              >
                {prediction.trend === 'up' ? '↗ Naik' : prediction.trend === 'down' ? '↘ Turun' : '→ Stabil'}
              </p>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        {lowStockCount > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Rekomendasi Restock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stockAnalysis
                .filter((s) => s.status === 'critical' || s.status === 'low')
                .slice(0, 6)
                .map((stock) => (
                  <div key={stock.productId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{stock.productName}</p>
                        <p className="text-sm text-slate-500">Stok: {stock.currentStock} unit</p>
                      </div>
                      <Badge variant={stock.status === 'critical' ? 'danger' : 'warning'}>
                        {stock.status === 'critical' ? 'Kritis' : 'Rendah'}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-600 mt-2">
                      Rekomendasi: +{stock.recommendedRestock} unit
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Insight AI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.slice(0, 4).map((insight, idx) => (
              <InsightCard
                key={idx}
                type={insight.type}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 mt-8 pt-4 text-center text-sm text-slate-500">
          <p>Laporan dibuat otomatis oleh Analistik UMKM</p>
          <p>{new Date().toLocaleString('id-ID')}</p>
        </div>
      </Card>
    </div>
  );
}
