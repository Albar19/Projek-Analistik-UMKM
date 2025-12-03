# 🚀 QUICK START - Setup Google Login (5 MENIT)

## ⚡ Pilihan:

### OPSI A: Pakai Demo Account (TERCEPAT)
```
Email: admin@umkm.local
Password: admin123
```
✅ Langsung bisa test app tanpa setup Google

### OPSI B: Setup Google (RECOMMENDED)

#### 1. Ke https://console.cloud.google.com

#### 2. Buat Project Baru
- Click "Select Project" → "NEW PROJECT"
- Nama: "UMKM Analytics"
- Create

#### 3. Enable Google+ API
- Search: "Google+ API" atau "People API"
- Enable

#### 4. OAuth Consent Screen
- APIs & Services → OAuth consent screen
- Pilih External
- Isi:
  - App name: UMKM Analytics
  - Support email: email@gmail.com
  - Developer contact: email@gmail.com
- Terus → Terus → Selesai

#### 5. Create Credentials
- APIs & Services → Credentials
- + CREATE CREDENTIALS → OAuth client ID
- Web application
- JavaScript origins:
  ```
  http://localhost:3000
  http://localhost:3001
  ```
- Redirect URIs:
  ```
  http://localhost:3000/api/auth/callback/google
  http://localhost:3001/api/auth/callback/google
  ```
- CREATE
- **COPY Client ID & Client Secret**

#### 6. Update `.env.local`
```env
GOOGLE_CLIENT_ID=PASTE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=PASTE_CLIENT_SECRET_HERE
NEXTAUTH_URL=http://localhost:3000
```

#### 7. Restart Server
```bash
npm run dev
```

#### 8. Test
- http://localhost:3000/login
- Klik tab "Google"
- Klik "Masuk dengan Google"
- ✅ Done!

---

## 📝 Tempat Edit `.env.local`

Buka file: `c:\Users\WINDOWS\Documents\Projek-Analistik-UMKM\try\.env.local`

Edit bagian ini:
```env
GOOGLE_CLIENT_ID=YOUR_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_SECRET_HERE
```

---

## ❓ FAQ

**Q: Mana yang lebih mudah?**
A: Demo Account (langsung jalan), tapi Google lebih profesional

**Q: Berapa lama setup Google?**
A: 5-10 menit kalau ikut langkah-langkah di atas

**Q: Bisa keduanya?**
A: Ya! Demo Account tetap bisa dipakai meskipun Google sudah setup

**Q: Error "redirect_uri_mismatch"?**
A: Pastikan redirect URI di Google Cloud sama dengan konfigurasi

**Q: Belum bisa?**
A: 
1. Baca `GOOGLE_OAUTH_SETUP_MUDAH.md` untuk detail lengkap
2. Cek server console untuk error details
3. Coba Demo Account terlebih dahulu

---

**Pilih salah satu dan test aplikasi sekarang! 🎯**
