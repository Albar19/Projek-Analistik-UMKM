# Database SQLite Setup Guide

## Instalasi

Database SQLite sudah dikonfigurasi menggunakan Prisma. Semua dependensi sudah terinstall.

## File Konfigurasi

- `prisma/schema.prisma` - Schema database
- `prisma/seed.ts` - Script untuk seed data awal
- `.env.local` - Environment variables (DATABASE_URL)

## Setup dan Seeding Data

### 1. Inisialisasi Database
```bash
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma db push
```

### 2. Seed Data Awal
Database sudah di-seed dengan 8 produk dan 190 catatan penjualan (30 hari terakhir).

Untuk re-seed data:
```bash
$env:DATABASE_URL="file:./prisma/dev.db"
npm run seed
```

### 3. Melihat Data Database (Prisma Studio)
```bash
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma studio
```

## Struktur Data

### Products (Produk)
- `id` - UUID unik
- `name` - Nama produk (unique)
- `category` - Kategori (Makanan Ringan, Minuman, Bumbu, dll)
- `price` - Harga jual
- `costPrice` - Harga pokok
- `stock` - Stok tersedia
- `minStock` - Stok minimum
- `unit` - Satuan (pcs, box, botol, kg)

### Sales (Penjualan)
- `id` - UUID unik
- `date` - Tanggal penjualan (format YYYY-MM-DD)
- `productId` - Referensi ke produk
- `quantity` - Jumlah terjual
- `price` - Harga per unit
- `total` - Total penjualan (quantity × price)

### Users
- Untuk autentikasi dan role management

### ActivityLog
- Untuk tracking aktivitas pengguna

### BusinessSettings
- Konfigurasi bisnis (nama toko, timezone, dll)

## API Endpoints

### Products
- `GET /api/products` - Dapatkan list produk
- `POST /api/products` - Tambah produk baru

### Sales
- `GET /api/sales` - Dapatkan data penjualan
- `POST /api/sales` - Tambah penjualan baru

### Analytics
- `GET /api/analytics` - Dapatkan insight dan statistik

## Query Parameters

### GET /api/sales
- `days` - Jumlah hari untuk filter (default: 30)
- `productId` - Filter berdasarkan produk tertentu

### GET /api/analytics
- `days` - Jumlah hari untuk analisis (default: 30)

## Environment Variables
```
DATABASE_URL="file:./prisma/dev.db"
NVIDIA_API_KEY=your_api_key_here
```

## Development

Saat development, jalankan:
```bash
npm run dev
```

Database akan otomatis di-generate saat aplikasi pertama kali dijalankan.

## Catatan
- Database file (`dev.db`) akan tersimpan di folder `prisma/`
- Gunakan Prisma Studio untuk visualisasi dan debugging database
- Untuk production, gunakan database yang lebih robust (PostgreSQL, MySQL, dll)
