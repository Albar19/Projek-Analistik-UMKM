# 🔐 Setup Google OAuth untuk Login

## ❌ Masalah Saat Ini
Error: `ClientFetchError - There was a problem with the server configuration`

**Penyebab**: Google OAuth credentials belum dikonfigurasi di `.env.local`

## ✅ Solusi: Setup Google OAuth Step-by-Step

### Step 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Klik **"Select a Project"** → **"NEW PROJECT"**
3. Masukkan nama: `UMKM Analytics`
4. Klik **"CREATE"**

### Step 2: Enable Google+ API

1. Di Cloud Console, klik **"APIs & Services"** → **"Library"**
2. Cari **"Google+ API"**
3. Klik dan tekan **"ENABLE"**

### Step 3: Create OAuth 2.0 Credentials

1. Klik **"APIs & Services"** → **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Jika diminta, klik **"Configure Consent Screen"** terlebih dahulu:
   - Pilih **"External"**
   - Isi App Name: `UMKM Analytics`
   - Email support: masukkan email Anda
   - Developer contact: masukkan email Anda
   - Klik **"SAVE AND CONTINUE"**
   - Lewati Scopes (klik "SAVE AND CONTINUE")
   - Lewati Test users (klik "SAVE AND CONTINUE")
   - Klik **"BACK TO DASHBOARD"**

4. Kembali ke **"Credentials"** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Pilih **"Web application"**
6. Di bagian **"Authorized redirect URIs"**, tambahkan:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google  (untuk production)
   ```
7. Klik **"CREATE"**
8. Copy **Client ID** dan **Client Secret** (jangan bagikan!)

### Step 4: Konfigurasi di `.env.local`

Update file `.env.local` Anda:

```env
DATABASE_URL="file:./prisma/dev.db"
NVIDIA_API_KEY=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

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_dari_step_3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_dari_step_3
```

### Step 5: Generate NEXTAUTH_SECRET

Di terminal PowerShell, jalankan:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output dan paste di `NEXTAUTH_SECRET` di `.env.local`

### Step 6: Restart Development Server

```bash
npm run dev
```

Tekan `Ctrl + C` untuk stop server, lalu jalankan lagi.

## 🧪 Test Login

1. Buka http://localhost:3000/login
2. Klik **"Sign in with Google"**
3. Pilih akun Google Anda
4. Anda akan diarahkan ke dashboard

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solusi**: Pastikan `NEXTAUTH_URL` dan redirect URI di Google Cloud sesuai dengan URL lokal/production Anda

### Error: "invalid_client"
**Solusi**: Pastikan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` benar (copy-paste lagi dari Google Cloud Console)

### Error: "AuthError" di console
**Solusi**: 
1. Restart development server
2. Clear browser cache (Ctrl + Shift + Delete)
3. Buka incognito tab dan coba lagi

### Localhost tidak bisa diakses
**Solusi**: Gunakan 127.0.0.1 atau coba port lain:
```bash
npm run dev -- -p 3001
```

## 📝 Production Setup

Untuk production, update `.env.local` (atau `.env.production`):

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=use-a-secure-random-secret
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
```

Dan di Google Cloud Console, tambahkan redirect URI:
```
https://yourdomain.com/api/auth/callback/google
```

## 🔒 Keamanan

- ✓ Jangan commit `.env.local` ke git (sudah ada di `.gitignore`)
- ✓ Jangan bagikan `GOOGLE_CLIENT_SECRET` dan `NEXTAUTH_SECRET`
- ✓ Gunakan environment variables yang berbeda untuk development dan production
- ✓ Regenerate secret secara berkala di production

## 📚 Referensi

- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com)
- [NextAuth Configuration](https://next-auth.js.org/configuration/options)

---

Setelah setup selesai, login dengan Google akan berfungsi! 🎉
