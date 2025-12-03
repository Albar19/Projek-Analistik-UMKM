# 📊 Panduan Setup SQLite Database

## ✅ Status Setup

Database SQLite sudah berhasil diintegrasikan ke proyek Anda! 

**Verifikasi Data:**
- ✓ 8 Produk sudah tersimpan
- ✓ 190 Catatan penjualan sudah tersimpan (30 hari terakhir)
- ✓ Database SQLite aktif dan berfungsi

## 📁 File-File yang Ditambahkan

```
prisma/
  ├── schema.prisma          # Schema database
  ├── seed.ts                 # Script untuk seed data awal
  └── dev.db                  # Database SQLite (otomatis dibuat)

lib/
  └── db.ts                   # Prisma client singleton

app/api/
  ├── products/route.ts       # API untuk products
  ├── sales/route.ts          # API untuk sales
  └── analytics/route.ts      # API untuk analytics
  
.env.local                     # Environment variables
DATABASE_SETUP.md              # Dokumentasi database
```

## 🚀 Cara Menjalankan

### 1. Development Mode
```bash
npm run dev
```
Database akan otomatis dimuat saat aplikasi berjalan.

### 2. Melihat Data (Prisma Studio)
```powershell
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma studio
```
Akan membuka dashboard visual untuk melihat dan mengedit data.

### 3. Re-seed Data (jika diperlukan)
```powershell
$env:DATABASE_URL="file:./prisma/dev.db"
npm run seed
```

## 📊 API Endpoints yang Tersedia

### Products
- **GET** `/api/products` - Dapatkan list produk
  - Query: `skip`, `take` (untuk pagination)
  - Response: `{ products: [], total: number }`

- **POST** `/api/products` - Tambah produk baru
  - Body: `{ name, category, price, costPrice, stock, minStock, unit }`

### Sales
- **GET** `/api/sales` - Dapatkan data penjualan
  - Query: `days` (default 30), `productId` (optional)
  - Response: `{ sales: [], dailySales: [], total: number }`

- **POST** `/api/sales` - Tambah penjualan baru
  - Body: `{ date, productId, productName, quantity, price, total }`

### Analytics
- **GET** `/api/analytics` - Dapatkan insights
  - Query: `days` (default 30)
  - Response: `{ totalRevenue, totalQuantity, totalTransactions, productSales: [], lowStockProducts: [] }`

## 🗄️ Struktur Database

### Tabel Products
| Field | Type | Deskripsi |
|-------|------|-----------|
| id | String (UUID) | Primary Key |
| name | String | Nama produk (unik) |
| category | String | Kategori produk |
| price | Int | Harga jual (Rp) |
| costPrice | Int | Harga pokok (Rp) |
| stock | Int | Stok tersedia |
| minStock | Int | Stok minimum |
| unit | String | Satuan (pcs, box, botol, kg) |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diubah |

### Tabel Sales
| Field | Type | Deskripsi |
|-------|------|-----------|
| id | String (UUID) | Primary Key |
| date | String | Tanggal (YYYY-MM-DD) |
| productId | String | FK ke Products |
| productName | String | Nama produk |
| quantity | Int | Jumlah terjual |
| price | Int | Harga per unit |
| total | Int | Total = quantity × price |
| createdAt | DateTime | Waktu dibuat |

## 🔄 Data yang Sudah Ada

### Produk (8 item)
1. Keripik Singkong - Makanan Ringan
2. Keripik Pisang - Makanan Ringan
3. Kopi Bubuk Premium - Minuman
4. Teh Celup - Minuman
5. Sambal Terasi - Bumbu
6. Madu Murni - Minuman
7. Kacang Goreng - Makanan Ringan
8. Gula Aren - Bumbu

### Penjualan
- 190 catatan penjualan untuk 30 hari terakhir
- Data ter-generate otomatis dengan pola real (lebih tinggi di akhir pekan)

## ⚙️ Environment Variables

File `.env.local` sudah dikonfigurasi:
```
DATABASE_URL="file:./prisma/dev.db"
NVIDIA_API_KEY=your_api_key_here
```

## 📝 Catatan Penting

1. **Database File**: `prisma/dev.db` adalah file SQLite yang tersimpan di disk
2. **Development**: Cocok untuk development dan testing
3. **Production**: Untuk production, gunakan database yang lebih robust seperti PostgreSQL atau MySQL
4. **Backup**: Jangan lupa backup file `dev.db` secara berkala

## 🛠️ Troubleshooting

### Database error saat development
```powershell
# Set environment variable
$env:DATABASE_URL="file:./prisma/dev.db"
npm run dev
```

### Reset database (hapus semua data)
```bash
rm prisma/dev.db
npx prisma db push
npm run seed
```

### Melihat SQL yang dijalankan
Tambahkan di `.env.local`:
```
DEBUG="prisma:*"
```

## 📚 Dokumentasi Lengkap

- [Prisma Documentation](https://www.prisma.io/docs/)
- [SQLite](https://www.sqlite.org/docs.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Setup berhasil! 🎉**

Sekarang Anda bisa:
1. Mengakses data melalui API endpoints
2. Menambah produk dan penjualan baru
3. Menganalisis data penjualan
4. Menggunakan Prisma untuk query database yang kompleks
