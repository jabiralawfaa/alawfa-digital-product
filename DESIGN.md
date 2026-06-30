# DESIGN.md
## Panduan Desain — Showcase Produk Digital

### 1. Prinsip Desain
- **Sederhana & ramah semua umur**: target dari ibu-ibu sampai remaja, jadi hindari UI yang terlalu "techy". Gunakan ikon + label teks, jangan hanya ikon.
- **Tombol besar & jelas**: terutama tombol "Kunjungi" — harus jadi elemen paling menonjol di halaman detail.
- **Mobile-first**: mayoritas pengguna mengakses lewat HP, desain dimulai dari layar kecil lalu melebar ke desktop.
- **Konsisten**: warna, jarak (spacing), dan tipografi mengikuti sistem yang sama di semua halaman.

### 2. Palet Warna

| Nama | Hex | Peran |
|---|---|---|
| Teal Cerah | `#08D9D6` | Warna aksen utama — tombol CTA "Kunjungi", link aktif, highlight |
| Gelap Netral | `#252A34` | Warna teks utama, background header/footer/dashboard (dark) |
| Merah Pink (Coral) | `#FF2E63` | Warna aksen sekunder — badge "Baru", notifikasi, hover state, statistik penting |
| Putih Keabu-abuan | `#EAEAEA` | Background utama halaman (light), kartu produk, area konten |

**Aturan pemakaian:**
- Background halaman publik: `#EAEAEA` dengan teks `#252A34`.
- Header/Navbar & Footer: background `#252A34`, teks/logo `#EAEAEA`, link aktif `#08D9D6`.
- Tombol utama (Primary CTA — "Kunjungi"): background `#08D9D6`, teks `#252A34` (kontras tinggi), hover → `#FF2E63` dengan teks putih.
- Tombol sekunder / badge kategori: outline `#08D9D6` atau solid `#FF2E63` untuk badge "Trending"/"Baru".
- Dashboard admin: tema lebih gelap (`#252A34` sebagai sidebar), kartu statistik putih (`#EAEAEA`) dengan angka besar warna `#08D9D6` (views) dan `#FF2E63` (clicks) agar mudah dibedakan sekilas.
- Jangan menggabungkan `#FF2E63` dan `#08D9D6` bersisian dalam blok besar (silau) — gunakan salah satu sebagai dominan, satu sebagai aksen kecil.

### 3. Tipografi
- Font sans-serif yang ramah dibaca: contoh `Inter`, `Poppins`, atau `Nunito` (bulat, terasa hangat, cocok untuk semua umur).
- Heading: bold, ukuran besar (h1 ~32–40px di desktop, ~24–28px di mobile).
- Body text: minimal 16px agar nyaman dibaca oleh segala usia (termasuk ibu-ibu yang mungkin kurang familiar layar kecil).
- Hindari font dekoratif/script untuk teks penting — boleh dipakai kecil untuk logo/tagline saja.

### 4. Layout & Komponen

#### 4.1 Halaman Katalog (Public Home)
```
<header>  → Logo + nav (Beranda, Kategori, Tentang)
<main>
  <section class="hero">  → judul singkat + tagline
  <section class="catalog">
     <article class="product-card">  → diulang per produk
        foto preview | judul | badge kategori | harga (opsional)
  </section>
<footer>  → kontak, sosial media, copyright
```
- `product-card` berbentuk grid responsif: 1 kolom (mobile) → 2 kolom (tablet) → 3–4 kolom (desktop).
- Setiap card punya efek hover ringan (scale/shadow) memakai aksen `#08D9D6`.

#### 4.2 Halaman Detail Produk
```
<main>
  <article class="product-detail">
    <figure>  → galeri foto/video (carousel sederhana)
    <header>  → judul produk + kategori
    <section class="description">  → teks deskripsi (mendukung paragraf, list)
    <a class="btn-cta" href="{link_lynk}" target="_blank">Kunjungi</a>
```
- Tombol CTA full-width di mobile, fixed di bagian bawah layar (sticky) agar selalu terlihat tanpa scroll.
- Saat halaman dibuka → trigger pencatatan **view** (sekali per page load).
- Saat tombol diklik → trigger pencatatan **click**, baru redirect ke link Lynk.id.

#### 4.3 Dashboard Admin
```
<aside class="sidebar">  → menu: Overview, Produk, Tambah Produk, Logout
<main class="dashboard-content">
  <section class="stats-overview">
     kartu: Total Produk | Total Views | Total Clicks | CTR rata-rata
  <section class="product-table">
     tabel: Foto | Judul | Views | Clicks | CTR | Aksi (Edit/Hapus)
  <section class="charts">
     grafik batang sederhana (views vs clicks per produk, 7/30 hari terakhir)
```
- Form "Tambah Produk Baru" sebagai modal atau halaman terpisah:
  - Upload foto preview (drag & drop + preview thumbnail sebelum submit).
  - Input: Judul, Kategori, Link Lynk.id, Harga (opsional).
  - Editor deskripsi (textarea / rich text ringan, mendukung markdown).
  - Upload media tambahan (multi-file: gambar & video) untuk galeri detail.
  - Tombol "Simpan Produk" — warna `#08D9D6`, loading state saat menyimpan ke GitHub repo.

### 5. Semantic HTML Checklist
Gunakan elemen sesuai makna, bukan `<div>` semua:
- `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- `<figure>` + `<figcaption>` untuk gambar/video produk
- `<button>` untuk aksi (bukan `<div onclick>`), `<a>` khusus untuk navigasi/link keluar
- `<form>`, `<label>`, `<fieldset>` pada form dashboard agar accessible (screen reader friendly)
- Atribut `alt` wajib di semua gambar produk

### 6. Aksesibilitas & Mobile
- Ukuran tombol minimal 44x44px (mudah disentuh).
- Kontras teks vs background memenuhi standar WCAG AA (cek `#252A34` di atas `#EAEAEA` — aman; `#08D9D6` untuk teks kecil di atas putih kurang kontras, jadi pakai untuk elemen besar/ikon saja).
- Hindari teks di atas `#FF2E63` polos tanpa outline gelap — gunakan teks putih (`#EAEAEA`) di atasnya.

### 7. Tone Visual
Ceria, bersih, terpercaya — seperti etalase toko online modern (terinspirasi gaya marketplace lokal) namun tetap minimalis agar tidak membingungkan pengguna awam.
