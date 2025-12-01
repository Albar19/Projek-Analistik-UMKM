'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { calculateDailySales, calculateProductSales } from '@/lib/data';
import { Card, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ChatMessage } from '@/lib/types';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  User,
  RefreshCw,
  Settings,
  AlertCircle,
} from 'lucide-react';

export default function KonsultasiPage() {
  const { sales, products, settings, chatHistory, addChatMessage, clearChatHistory } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate business context
  const dailySales = calculateDailySales(sales);
  const productSales = calculateProductSales(sales, 30);
  const totalRevenue = dailySales.reduce((sum, d) => sum + d.total, 0);
  const topProducts = productSales.slice(0, 5);
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Business context for AI
  const businessContext = `
Data Bisnis Toko "${settings.storeName}":
- Total Penjualan 30 hari: ${formatCurrency(totalRevenue)}
- Rata-rata Harian: ${formatCurrency(totalRevenue / 30)}
- Total Produk: ${products.length}
- Produk Terlaris: ${topProducts.map((p) => p.productName).join(', ')}
- Produk Stok Rendah: ${lowStockProducts.map((p) => p.name).join(', ') || 'Tidak ada'}
  `.trim();

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    // Check if NVIDIA API key is set
    if (settings.nvidiaApiKey) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input,
            context: businessContext,
            apiKey: settings.nvidiaApiKey,
          }),
        });

        const data = await response.json();

        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: data.response || 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
        };
        addChatMessage(aiMessage);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.',
          timestamp: new Date(),
        };
        addChatMessage(errorMessage);
      }
    } else {
      // Fallback local responses
      setTimeout(() => {
        const responses = generateLocalResponse(input, {
          totalRevenue,
          topProducts,
          lowStockProducts,
          products,
          dailySales,
        });

        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: responses,
          timestamp: new Date(),
        };
        addChatMessage(aiMessage);
        setIsLoading(false);
      }, 1500);
      return;
    }

    setIsLoading(false);
  };

  // Quick prompts
  const quickPrompts = [
    'Bagaimana cara meningkatkan penjualan?',
    'Produk mana yang perlu di-restock?',
    'Saran promo untuk minggu ini',
    'Analisis produk yang kurang laku',
    'Rekomendasi bundling produk',
    'Strategi untuk meningkatkan keuntungan',
  ];

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">💬 Konsultasi AI</h1>
          <p className="text-slate-500 mt-1">Tanya strategi bisnis ke asisten AI</p>
        </div>
        <div className="flex items-center gap-3">
          {!settings.nvidiaApiKey && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              API belum dikonfigurasi
            </Badge>
          )}
          <Button variant="outline" onClick={clearChatHistory}>
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Halo! Saya Asisten AI Anda</h3>
                  <p className="text-slate-500 mt-2 max-w-md">
                    Saya dapat membantu Anda dengan strategi bisnis, rekomendasi restock, saran promo,
                    dan analisis penjualan berdasarkan data toko Anda.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Ketik pertanyaan Anda..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 min-h-[44px] max-h-32"
                  rows={1}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Prompts */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Pertanyaan Cepat</h3>
            </div>
            <div className="space-y-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="w-full text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          {/* Business Context */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3">📊 Konteks Bisnis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Produk</span>
                <span className="font-medium">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan 30 hari</span>
                <span className="font-medium">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stok Rendah</span>
                <span className="font-medium text-red-600">{lowStockProducts.length}</span>
              </div>
            </div>
          </Card>

          {/* API Status */}
          <Card className={settings.nvidiaApiKey ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
            <div className="flex items-center gap-2">
              {settings.nvidiaApiKey ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-700">NVIDIA NIM Terhubung</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm text-yellow-700">Mode Offline</span>
                </>
              )}
            </div>
            {!settings.nvidiaApiKey && (
              <p className="text-xs text-yellow-600 mt-2">
                Konfigurasi API key di Pengaturan untuk respons AI yang lebih baik
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Local response generator (fallback when no API key)
function generateLocalResponse(
  input: string,
  context: {
    totalRevenue: number;
    topProducts: { productName: string; totalQuantity: number; totalRevenue: number }[];
    lowStockProducts: { name: string; stock: number }[];
    products: { name: string; price: number; stock: number }[];
    dailySales: { date: string; total: number }[];
  }
): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('penjualan') || lowerInput.includes('sales')) {
    return `📊 Analisis Penjualan:

Total penjualan 30 hari terakhir: ${formatCurrency(context.totalRevenue)}
Rata-rata harian: ${formatCurrency(context.totalRevenue / 30)}

Rekomendasi:
1. Fokus promosi pada produk terlaris untuk meningkatkan volume
2. Buat bundling produk untuk meningkatkan nilai transaksi
3. Evaluasi produk dengan penjualan rendah`;
  }

  if (lowerInput.includes('restock') || lowerInput.includes('stok')) {
    if (context.lowStockProducts.length > 0) {
      return `📦 Rekomendasi Restock:

Produk dengan stok rendah:
${context.lowStockProducts.map((p) => `• ${p.name}: ${p.stock} unit`).join('\n')}

Saran:
1. Prioritaskan restock produk terlaris dengan stok rendah
2. Pesan dalam jumlah yang cukup untuk 2-4 minggu
3. Pertimbangkan lead time supplier`;
    }
    return '✅ Semua produk memiliki stok yang cukup. Tetap monitor secara berkala!';
  }

  if (lowerInput.includes('promo') || lowerInput.includes('diskon')) {
    return `🎯 Saran Promo Minggu Ini:

1. Bundle Deal
   Gabungkan ${context.topProducts[0]?.productName || 'produk terlaris'} dengan produk pelengkap

2. Flash Sale
   Diskon 10-15% untuk produk dengan stok berlebih

3. Loyalty Reward
   Bonus item untuk pembelian di atas nilai tertentu

4. Paket Hemat
   Harga spesial untuk pembelian dalam jumlah banyak`;
  }

  if (lowerInput.includes('bundling') || lowerInput.includes('paket')) {
    const products = context.topProducts.slice(0, 3);
    return `🎁 Rekomendasi Bundling Produk:

Paket 1: "${products[0]?.productName || 'Produk A'} + ${products[1]?.productName || 'Produk B'}"
- Harga bundle: diskon 10% dari total
- Target: pelanggan yang beli salah satu produk

Paket 2: "Paket Lengkap"
- Gabungkan 3-4 produk populer
- Diskon 15-20% dari harga satuan

Tips:
• Kombinasikan produk yang saling melengkapi
• Harga bundle harus menarik (minimal 10% lebih murah)
• Buat nama paket yang menarik`;
  }

  if (lowerInput.includes('keuntungan') || lowerInput.includes('profit') || lowerInput.includes('margin')) {
    return `💰 Strategi Meningkatkan Keuntungan:

1. Optimasi Margin
   • Review harga jual produk secara berkala
   • Negosiasi harga dengan supplier

2. Efisiensi Operasional
   • Kurangi produk slow-moving
   • Optimalkan jumlah stok

3. Tingkatkan Penjualan
   • Fokus pada produk dengan margin tinggi
   • Upselling dan cross-selling

4. Analisis Data
   • Monitor produk dengan profit tertinggi
   • Evaluasi produk yang merugi`;
  }

  // Default response
  return `Terima kasih atas pertanyaan Anda!

Saya dapat membantu dengan:
• Analisis penjualan dan tren
• Rekomendasi restock produk
• Saran promo dan strategi pemasaran
• Ide bundling produk
• Strategi meningkatkan keuntungan

Silakan tanyakan hal spesifik tentang bisnis Anda, dan saya akan memberikan saran berdasarkan data yang ada.

💡 Tip: Konfigurasi API NVIDIA NIM di Pengaturan untuk mendapatkan respons AI yang lebih cerdas dan personal!`;
}
