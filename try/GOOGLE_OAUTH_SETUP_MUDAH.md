# 🔐 Setup Google OAuth - PANDUAN LENGKAP

## ⚠️ Error yang Terjadi
Error 401: `invalid_client` terjadi karena Google Client ID & Secret belum dikonfigurasi atau salah.

## ✅ CARA SETUP (5 Menit)

### STEP 1: Buka Google Cloud Console
Kunjungi: https://console.cloud.google.com/

### STEP 2: Buat Project Baru
1. Klik **"Select a Project"** (atas kiri)
2. Klik **"NEW PROJECT"**
3. Nama project: `UMKM Analytics` atau nama apapun
4. Klik **"CREATE"**
5. Tunggu project selesai dibuat (2-3 menit)

### STEP 3: Enable Google+ API
1. Cari di search bar: **"Google+ API"** atau **"People API"**
2. Klik library results
3. Klik **"ENABLE"**

### STEP 4: Setup OAuth Consent Screen
1. Di sidebar, klik **"APIs & Services"** → **"OAuth consent screen"**
2. Pilih **"External"**
3. Klik **"CREATE"**
4. Isi form:
   - **App name**: `UMKM Analytics`
   - **User support email**: Email Anda (contoh: yourname@gmail.com)
   - **Developer contact**: Email Anda
5. Klik **"SAVE AND CONTINUE"**
6. Lewati halaman "Scopes" → klik **"SAVE AND CONTINUE"**
7. Lewati halaman "Test users" → klik **"SAVE AND CONTINUE"**
8. Review dan klik **"BACK TO DASHBOARD"**

### STEP 5: Create OAuth Credentials
1. Di sidebar, klik **"APIs & Services"** → **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Pilih **"Web application"**
4. Di bagian **"Authorized JavaScript origins"**, tambahkan:
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   http://localhost:3001
   ```
5. Di bagian **"Authorized redirect URIs"**, tambahkan:
   ```
   http://localhost:3000/api/auth/callback/google
   http://127.0.0.1:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   ```
6. Klik **"CREATE"**

### STEP 6: Copy Credentials
Akan ada popup dengan Client ID dan Client Secret:
- **Jangan tutup popup ini!**
- Copy **Client ID** (disimpan dulu di notepad)
- Copy **Client Secret** (simpan juga di notepad)

### STEP 7: Update `.env.local`

Edit file `.env.local` di project folder:

```env
DATABASE_URL="file:./prisma/dev.db"
NVIDIA_API_KEY=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

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars

GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_DARI_STEP_6
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_DARI_STEP_6
```

**Contoh:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
```

### STEP 8: Restart Development Server
Matikan server (Ctrl + C) dan jalankan lagi:
```bash
npm run dev
```

### STEP 9: Test Google Login
1. Buka http://localhost:3000/login
2. Klik tab **"Google"**
3. Klik **"Masuk dengan Google"**
4. Pilih akun Google Anda
5. ✅ Sukses! Anda akan masuk ke dashboard

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Penyebab**: Redirect URI di Google Cloud tidak sesuai
**Solusi**: 
- Pastikan Anda tambahkan semua 3 redirect URI di STEP 5
- Pastikan URL di browser sama dengan yang terdaftar

### Error: "invalid_client"  
**Penyebab**: Client ID atau Secret salah
**Solusi**:
- Copy lagi dari Google Cloud Console
- Pastikan tidak ada spasi di awal/akhir
- Restart development server

### Error: "invalid_request"
**Penyebab**: NEXTAUTH_URL tidak sesuai
**Solusi**:
- Pastikan NEXTAUTH_URL di `.env.local` sesuai URL browser
- Jika pakai port 3001: ubah ke `NEXTAUTH_URL=http://localhost:3001`

### Google button tidak muncul
**Penyebab**: Google credentials tidak dikonfigurasi
**Solusi**: 
- Reload halaman (F5)
- Check console (F12) untuk error
- Pastikan `.env.local` sudah di-save dengan baik

---

## ✅ Checklist Sebelum Login

- [ ] Project dibuat di Google Cloud
- [ ] Google+ API di-enable
- [ ] OAuth consent screen di-setup
- [ ] Credentials dibuat (Web application)
- [ ] JavaScript origins ditambahkan (3 URL)
- [ ] Redirect URIs ditambahkan (3 URL)
- [ ] Client ID & Secret di-copy
- [ ] `.env.local` di-update dengan credentials
- [ ] Development server di-restart
- [ ] Coba login dengan Google

---

## 🚨 PENTING

1. **Jangan bagikan Client Secret ke siapa pun!**
2. **Jangan commit `.env.local` ke Git** (sudah ada di `.gitignore`)
3. **Untuk production, gunakan domain production, bukan localhost**
4. **Jika ada error, lihat server console (bukan browser console)**

---

## 📞 Masih Error?

Kalau sudah semua langkah tapi masih error:
1. Check server console untuk error details
2. Cek di https://console.cloud.google.com bahwa credentials benar
3. Coba dengan Demo Account terlebih dahulu (admin@umkm.local / admin123)
4. Setelah itu ambil waktu untuk setup Google dengan teliti

---

**Setup Google OAuth selesai! Sekarang Anda bisa login dengan Google! 🎉**
