'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import {
  Settings,
  Store,
  Database,
  Shield,
  Bell,
  Key,
  Save,
  Plus,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function PengaturanPage() {
  const { settings, updateSettings, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState('store');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    storeAddress: '',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  });

  const [categoryForm, setCategoryForm] = useState({
    categories: ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
    units: ['Pcs', 'Box', 'Kg', 'Liter'],
    newCategory: '',
    newUnit: '',
  });

  const [stockForm, setStockForm] = useState({
    minStockAlert: 10,
  });

  const [notifForm, setNotifForm] = useState({
    emailNotifications: false,
    notificationEmail: '',
    stockAlertEnabled: true,
    salesAlertEnabled: true,
    predictionAlertEnabled: true,
    systemNotificationsEnabled: true,
    lowStockThreshold: 20,
    salesDropThreshold: 20,
  });

  // Update form when settings loaded from cloud
  useEffect(() => {
    if (!isLoading && settings) {
      setStoreForm({
        storeName: settings.storeName || settings.businessName || '',
        storeAddress: settings.storeAddress || '',
        timezone: settings.timezone || 'Asia/Jakarta',
        currency: settings.currency || 'IDR',
      });
      setCategoryForm(prev => ({
        ...prev,
        categories: settings.categories || ['Makanan', 'Minuman', 'Snack', 'Lainnya'],
        units: settings.units || ['Pcs', 'Box', 'Kg', 'Liter'],
      }));
      setStockForm({
        minStockAlert: settings.minStockAlert || settings.lowStockThreshold || 10,
      });
      setNotifForm({
        emailNotifications: settings.emailNotifications || settings.enableNotifications || false,
        notificationEmail: settings.notificationEmail || '',
        stockAlertEnabled: true,
        salesAlertEnabled: true,
        predictionAlertEnabled: true,
        systemNotificationsEnabled: true,
        lowStockThreshold: settings.lowStockThreshold || settings.minStockAlert || 20,
        salesDropThreshold: 20,
      });
    }
  }, [isLoading, settings]);

  // Save handlers
  const handleSave = () => {
    setIsSaving(true);

    updateSettings({
      ...storeForm,
      ...categoryForm,
      minStockAlert: stockForm.minStockAlert,
      emailNotifications: notifForm.emailNotifications,
      notificationEmail: notifForm.notificationEmail,
    });

    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 500);
  };

  // Show loading while data is loading from cloud
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memuat pengaturan...</span>
      </div>
    );
  }

  // Add category/unit
  const addCategory = () => {
    if (categoryForm.newCategory && !categoryForm.categories.includes(categoryForm.newCategory)) {
      setCategoryForm({
        ...categoryForm,
        categories: [...categoryForm.categories, categoryForm.newCategory],
        newCategory: '',
      });
    }
  };

  const addUnit = () => {
    if (categoryForm.newUnit && !categoryForm.units.includes(categoryForm.newUnit)) {
      setCategoryForm({
        ...categoryForm,
        units: [...categoryForm.units, categoryForm.newUnit],
        newUnit: '',
      });
    }
  };

  const removeCategory = (cat: string) => {
    setCategoryForm({
      ...categoryForm,
      categories: categoryForm.categories.filter((c) => c !== cat),
    });
  };

  const removeUnit = (unit: string) => {
    setCategoryForm({
      ...categoryForm,
      units: categoryForm.units.filter((u) => u !== unit),
    });
  };

  const tabs = [
    { id: 'store', label: 'Info Toko', icon: Store },
    { id: 'products', label: 'Produk', icon: Database },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'security', label: 'Keamanan', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">⚙️ Pengaturan</h1>
          <p className="text-slate-500 mt-1">Konfigurasi aplikasi dan bisnis Anda</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Pengaturan
            </>
          )}
        </Button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Store Info */}
          {activeTab === 'store' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Informasi Toko</h2>
              <div className="space-y-4">
                <Input
                  label="Nama Toko"
                  value={storeForm.storeName}
                  onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                />
                <Textarea
                  label="Alamat"
                  value={storeForm.storeAddress}
                  onChange={(e) => setStoreForm({ ...storeForm, storeAddress: e.target.value })}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Zona Waktu"
                    options={[
                      { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
                      { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
                      { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
                    ]}
                    value={storeForm.timezone}
                    onChange={(e) => setStoreForm({ ...storeForm, timezone: e.target.value })}
                  />
                  <Select
                    label="Mata Uang"
                    options={[
                      { value: 'IDR', label: 'IDR (Rupiah)' },
                      { value: 'USD', label: 'USD (Dollar)' },
                    ]}
                    value={storeForm.currency}
                    onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Products Settings */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Categories */}
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Kategori Produk</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoryForm.categories.map((cat) => (
                    <Badge key={cat} variant="default" className="flex items-center gap-1 pr-1">
                      {cat}
                      <button
                        onClick={() => removeCategory(cat)}
                        className="ml-1 p-0.5 hover:bg-slate-200 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah kategori baru..."
                    value={categoryForm.newCategory}
                    onChange={(e) => setCategoryForm({ ...categoryForm, newCategory: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={addCategory} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Units */}
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Satuan Produk</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoryForm.units.map((unit) => (
                    <Badge key={unit} variant="default" className="flex items-center gap-1 pr-1">
                      {unit}
                      <button
                        onClick={() => removeUnit(unit)}
                        className="ml-1 p-0.5 hover:bg-slate-200 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah satuan baru..."
                    value={categoryForm.newUnit}
                    onChange={(e) => setCategoryForm({ ...categoryForm, newUnit: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={addUnit} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Min Stock */}
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Pengaturan Stok</h2>
                <Input
                  label="Batas Minimum Stok (default)"
                  type="number"
                  value={stockForm.minStockAlert}
                  onChange={(e) => setStockForm({ minStockAlert: parseInt(e.target.value) || 0 })}
                  helperText="Peringatan akan muncul jika stok di bawah nilai ini"
                />
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Pengaturan Notifikasi</h2>
              <div className="space-y-6">
                {/* Stock Alert */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-medium text-slate-900">📦 Alert Stok Produk</p>
                      <p className="text-sm text-slate-500">Notifikasi ketika stok menipis atau habis</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifForm({
                          ...notifForm,
                          stockAlertEnabled: !notifForm.stockAlertEnabled,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifForm.stockAlertEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifForm.stockAlertEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {notifForm.stockAlertEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Ambang Stok Rendah: {notifForm.lowStockThreshold}%
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={notifForm.lowStockThreshold}
                          onChange={(e) =>
                            setNotifForm({
                              ...notifForm,
                              lowStockThreshold: parseInt(e.target.value),
                            })
                          }
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sales Alert */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-medium text-slate-900">📊 Alert Penjualan</p>
                      <p className="text-sm text-slate-500">Notifikasi jika tidak ada penjualan hari ini</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifForm({
                          ...notifForm,
                          salesAlertEnabled: !notifForm.salesAlertEnabled,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifForm.salesAlertEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifForm.salesAlertEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {notifForm.salesAlertEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Ambang Penurunan Penjualan: {notifForm.salesDropThreshold}%
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={notifForm.salesDropThreshold}
                          onChange={(e) =>
                            setNotifForm({
                              ...notifForm,
                              salesDropThreshold: parseInt(e.target.value),
                            })
                          }
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Prediction Alert */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">🔮 Alert Prediksi</p>
                      <p className="text-sm text-slate-500">Notifikasi untuk prediksi penjualan negatif</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifForm({
                          ...notifForm,
                          predictionAlertEnabled: !notifForm.predictionAlertEnabled,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifForm.predictionAlertEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifForm.predictionAlertEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* System Notifications */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">ℹ️ Notifikasi Sistem</p>
                      <p className="text-sm text-slate-500">Update dan informasi penting lainnya</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifForm({
                          ...notifForm,
                          systemNotificationsEnabled: !notifForm.systemNotificationsEnabled,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifForm.systemNotificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifForm.systemNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-medium text-slate-900">📧 Email Notifications</p>
                    <button
                      onClick={() =>
                        setNotifForm({
                          ...notifForm,
                          emailNotifications: !notifForm.emailNotifications,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifForm.emailNotifications ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifForm.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {notifForm.emailNotifications && (
                    <Input
                      label="Email Notifikasi"
                      type="email"
                      value={notifForm.notificationEmail}
                      onChange={(e) =>
                        setNotifForm({
                          ...notifForm,
                          notificationEmail: e.target.value,
                        })
                      }
                      placeholder="email@example.com"
                    />
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">💡 Tips Pengaturan Notifikasi</p>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                        <li>Atur ambang batas sesuai kebutuhan bisnis Anda</li>
                        <li>Email alert akan dikirim untuk alert kritis (stok habis, tidak ada penjualan)</li>
                        <li>Disable notifikasi yang tidak perlu untuk mengurangi gangguan</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Keamanan & User Roles</h2>
              <div className="space-y-6">
                {/* Current User */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">User Saat Ini</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Admin</p>
                      <p className="text-sm text-slate-500">admin@example.com</p>
                      <Badge variant="info" className="mt-1">
                        Administrator
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Roles Info */}
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Role yang Tersedia</h3>
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">Admin</span>
                        <Badge variant="info">Full Access</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Akses penuh ke semua fitur dan pengaturan
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">Staff</span>
                        <Badge variant="success">Limited Access</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Dapat input data dan melihat laporan, tidak bisa akses pengaturan
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">Viewer</span>
                        <Badge variant="default">View Only</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Hanya dapat melihat dashboard dan laporan
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800">Fitur Multi-User</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Fitur manajemen multi-user, audit log, dan backup otomatis akan tersedia
                        pada versi berikutnya.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
