# DESIGN.md
## Panduan Desain — Al-Awfa Digital Product (Website)

Berdasarkan brand guidelines dari `design-rule.md` (Instagram @jabiralawfaa), diadaptasi untuk website.

### 1. Prinsip Desain
- **Sederhana, hangat, & premium**: target dari ibu-ibu sampai remaja. Hindari UI yang terlalu "techy".
- **Tombol besar & jelas**: CTA utama harus paling menonjol.
- **Mobile-first**: mayoritas via HP, desain dimulai dari layar kecil lalu melebar.
- **Konsisten dengan brand Instagram**: warna palet mengikuti identitas visual @jabiralawfaa.

### 2. Palet Warna

| Nama | Hex | Peran |
|---|---|---|
| Cream Milk | `#FBF5DD` | Background utama halaman (public & admin) — bersih, lembut, premium |
| Soft Sage | `#E7E1B1` | Background sekunder — kartu produk, card, section divider |
| Fresh Green | `#306D29` | Warna aksen utama — tombol CTA, link, icon aktif, highlight |
| Deep Forest | `#0D530E` | Teks utama, judul, border, ikon — kontras tinggi, profesional |

**Aturan pemakaian:**
- Background halaman publik: `#FBF5DD`. Teks utama: `#0D530E`.
- Kartu produk / card: background `#E7E1B1`, teks `#0D530E`.
- Tombol utama (Primary CTA): background `#306D29`, teks putih (`#FFFFFF`), hover → turunkan brightness atau beri shadow.
- Badge / label kategori: background `#306D29` dengan teks putih, atau outline `#306D29`.
- Header/Navbar: background `#0D530E` (solid, gelap), teks/logo putih, link aktif `#FBF5DD`.
- Dashboard admin: sidebar `#0D530E`, konten `#FBF5DD`, card `#E7E1B1`.
- **Kontras wajib**: teks `#0D530E` di atas `#FBF5DD` atau `#E7E1B1`. Jangan pernah letakkan teks hijau di atas background hijau.
- **Hindari penggunaan warna di luar palet** (merah menyala, biru dongker, ungu, neon).

### 3. Tipografi
- Font utama: **Poppins** (Google Fonts) — sans-serif, bulat, hangat, cocok untuk semua umur.
- Heading: Bold, warna `#0D530E`. Ukuran besar (h1 ~32–40px desktop, ~24–28px mobile).
- Body text: minimal 16px, warna `#0D530E` dengan opacity 85% untuk teks sekunder.
- Link / CTA: warna `#306D29`, bold.
- Hindari font dekoratif/script untuk teks penting.

### 4. Layout & Komponen

#### 4.1 Halaman Utama (Landing Page)
```
<header class="navbar">  → Logo + nav (Beranda, Tentang, Katalog, Jasa, Kontak)
<main>
  <section class="hero">  → judul + tagline, background #0D530E solid atau gradasi gelap
  <section class="about">  → kartu tentang (bg #E7E1B1)
  <section class="catalog">  → grid produk (card bg #E7E1B1)
  <section class="services">  → grid jasa (card bg #E7E1B1)
  <section class="contact">  → form kontak
<footer>  → background #0D530E, teks putih
```
- `product-card` / `service-card`: background `#E7E1B1`, border-radius 12px, hover shadow hijau.
- Grid: 1 kolom (mobile) → 2 kolom (tablet) → 3 kolom (desktop).

#### 4.2 Halaman Detail Produk
```
<main>
  <article class="product-detail">
    <figure>  → foto/video preview
    <header>  → judul + kategori + harga
    <section class="description">  → deskripsi kaya HTML
    <a class="btn-cta" href="{lynk}" target="_blank">Kunjungi</a>
```
- Tombol CTA: background `#306D29` → hover `#0D530E`, teks putih.
- Fixed di bottom mobile, static center di desktop.

#### 4.3 Dashboard Admin
```
<aside class="sidebar">  → background #0D530E
<main class="dashboard-content">  → background #FBF5DD
  kartu statistik, tabel produk, form modal
```
- Sidebar: `#0D530E`, link aktif `#FBF5DD`.
- Tombol aksi: Edit (`#306D29`), Hapus (`#0D530E` dengan opacity).
- Modal: background `#FBF5DD`, border `#E7E1B1`.

### 5. Semantic HTML Checklist
- `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- `<figure>` + `<figcaption>` untuk media produk
- `<button>` untuk aksi, `<a>` untuk navigasi/link keluar
- `<form>`, `<label>`, `<fieldset>` untuk form
- Atribut `alt` wajib di semua gambar

### 6. Aksesibilitas
- Ukuran tombol minimal 44x44px.
- Kontras `#0D530E` di atas `#FBF5DD` — aman WCAG AA.
- Jangan letakkan teks di atas `#306D29` tanpa kontras cukup.
- White space minimal 30% tiap halaman.

### 7. Tone Visual
Hangat, alami, terpercaya — seperti toko online yang nyaman dikunjungi semua kalangan. Warna krem/hijau memberikan kesan organik, tumbuh, dan profesional.
