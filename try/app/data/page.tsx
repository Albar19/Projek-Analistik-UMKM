'use client';

import { useState, useMemo, useRef } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { Card, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Sale, Product } from '@/lib/types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  History,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function DataPage() {
  const {
    sales,
    products,
    activityLogs,
    addSale,
    addManySales,
    updateSale,
    deleteSale,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'logs'>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Sale | Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    price: '',
  });

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '',
    unit: 'pcs',
  });

  // Filtered data
  const filteredSales = useMemo(() => {
    return sales
      .filter(
        (s) =>
          s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.date.includes(searchQuery)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Handle add sale
  const handleAddSale = () => {
    const product = products.find((p) => p.id === saleForm.productId);
    if (!product || !saleForm.quantity) return;

    const quantity = parseInt(saleForm.quantity);
    const price = saleForm.price ? parseFloat(saleForm.price) : product.price;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      date: saleForm.date,
      productId: product.id,
      productName: product.name,
      quantity,
      price,
      total: quantity * price,
      createdAt: new Date(),
    };

    addSale(newSale);
    setSaleForm({
      date: new Date().toISOString().split('T')[0],
      productId: '',
      quantity: '',
      price: '',
    });
    setShowAddModal(false);
  };

  // Handle add product
  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productForm.name,
      category: productForm.category || 'Lainnya',
      price: parseFloat(productForm.price),
      costPrice: parseFloat(productForm.costPrice) || 0,
      stock: parseInt(productForm.stock) || 0,
      minStock: parseInt(productForm.minStock) || 10,
      unit: productForm.unit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addProduct(newProduct);
    setProductForm({
      name: '',
      category: '',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '',
      unit: 'pcs',
    });
    setShowAddModal(false);
  };

  // Handle import Excel
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      // Parse and add sales
      const newSales: Sale[] = jsonData.map((row, idx: number) => {
        const product = products.find(
          (p) => p.name.toLowerCase() === String(row['Produk'] || row['Product'] || '').toLowerCase()
        );
        const quantity = parseInt(String(row['Jumlah'] || row['Quantity'] || 1));
        const price = parseFloat(String(row['Harga'] || row['Price'] || product?.price || 0));

        return {
          id: `import-${Date.now()}-${idx}`,
          date: String(row['Tanggal'] || row['Date'] || new Date().toISOString().split('T')[0]),
          productId: product?.id || 'unknown',
          productName: String(row['Produk'] || row['Product'] || 'Unknown'),
          quantity,
          price,
          total: quantity * price,
          createdAt: new Date(),
        };
      });

      addManySales(newSales);
      alert(`Berhasil import ${newSales.length} data penjualan!`);
    };
    reader.readAsArrayBuffer(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData =
      activeTab === 'sales'
        ? filteredSales.map((s) => ({
            Tanggal: s.date,
            Produk: s.productName,
            Jumlah: s.quantity,
            Harga: s.price,
            Total: s.total,
          }))
        : filteredProducts.map((p) => ({
            Nama: p.name,
            Kategori: p.category,
            Harga: p.price,
            'Harga Modal': p.costPrice,
            Stok: p.stock,
            'Min Stok': p.minStock,
            Unit: p.unit,
          }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'sales' ? 'Penjualan' : 'Produk');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🗂️ Manajemen Data</h1>
          <p className="text-slate-500 mt-1">Kelola data penjualan dan produk</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah {activeTab === 'sales' ? 'Penjualan' : 'Produk'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'sales', label: 'Penjualan', icon: FileSpreadsheet },
          { id: 'products', label: 'Produk', icon: FileSpreadsheet },
          { id: 'logs', label: 'Log Aktivitas', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'logs' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={`Cari ${activeTab === 'sales' ? 'penjualan' : 'produk'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Content */}
      <Card>
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Harga
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, 50).map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(sale.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {sale.productName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sale.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(sale.price)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteSale(sale.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <p className="text-center py-8 text-slate-500">Tidak ada data penjualan</p>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Harga</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {product.stock} {product.unit}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          product.stock <= product.minStock * 0.5
                            ? 'danger'
                            : product.stock <= product.minStock
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {product.stock <= product.minStock * 0.5
                          ? 'Kritis'
                          : product.stock <= product.minStock
                          ? 'Rendah'
                          : 'Normal'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="text-center py-8 text-slate-500">Tidak ada produk</p>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            {activityLogs.slice(0, 50).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{log.userName}</span>
                    <Badge variant="default">{log.action}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <p className="text-center py-8 text-slate-500">Belum ada aktivitas</p>
            )}
          </div>
        )}
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Tambah {activeTab === 'sales' ? 'Penjualan' : 'Produk'}
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {activeTab === 'sales' ? (
              <div className="space-y-4">
                <Input
                  label="Tanggal"
                  type="date"
                  value={saleForm.date}
                  onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                />
                <Select
                  label="Produk"
                  options={[
                    { value: '', label: 'Pilih produk...' },
                    ...products.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  value={saleForm.productId}
                  onChange={(e) => {
                    const product = products.find((p) => p.id === e.target.value);
                    setSaleForm({
                      ...saleForm,
                      productId: e.target.value,
                      price: product?.price.toString() || '',
                    });
                  }}
                />
                <Input
                  label="Jumlah"
                  type="number"
                  value={saleForm.quantity}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                />
                <Input
                  label="Harga (opsional)"
                  type="number"
                  value={saleForm.price}
                  onChange={(e) => setSaleForm({ ...saleForm, price: e.target.value })}
                  helperText="Kosongkan untuk menggunakan harga default produk"
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button onClick={handleAddSale} className="flex-1">
                    Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Nama Produk"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
                <Input
                  label="Kategori"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Harga Jual"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                  <Input
                    label="Harga Modal"
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Stok"
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                  <Input
                    label="Min. Stok"
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })}
                  />
                </div>
                <Select
                  label="Unit"
                  options={[
                    { value: 'pcs', label: 'pcs' },
                    { value: 'box', label: 'box' },
                    { value: 'kg', label: 'kg' },
                    { value: 'botol', label: 'botol' },
                    { value: 'liter', label: 'liter' },
                  ]}
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button onClick={handleAddProduct} className="flex-1">
                    Simpan
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
