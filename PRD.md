# PRD (Product Requirements Document)
## Showcase Produk Digital — Lynk.id Redirect Hub

### 1. Latar Belakang
Saat ini produk digital (ebook, template, kelas online, dll) dijual melalui Lynk.id. Dibutuhkan sebuah website "etalase" terpisah yang menampilkan katalog produk secara lebih menarik dan profesional, lalu mengarahkan (redirect) pengunjung ke halaman checkout asli di Lynk.id saat mereka klik tombol **"Kunjungi"**. Website ini tidak menangani transaksi/pembayaran sama sekali — murni sebagai showcase dan funnel.

### 2. Tujuan Produk
- Menyediakan tampilan katalog produk digital yang rapi, cepat, dan enak dilihat semua kalangan (ibu-ibu, remaja, umum).
- Memudahkan pemilik bisnis mengelola produk (tambah/edit/hapus) tanpa perlu coding lewat dashboard.
- Melacak performa tiap produk: berapa kali dilihat (views) dan berapa kali tombol "Kunjungi" diklik (clicks), sebagai indikator minat sebelum closing di Lynk.id.
- Tidak butuh server backend mahal — data disimpan di GitHub repo (lihat SYS.md).

### 3. Target Pengguna
| Tipe | Kebutuhan |
|---|---|
| Pengunjung umum (ibu-ibu, remaja, dst) | Tampilan sederhana, jelas, tombol besar, loading cepat, mobile-friendly |
| Admin/Owner (pemilik produk) | Dashboard mudah dipakai untuk upload produk baru & memantau statistik |

### 4. Lingkup (Scope)

#### 4.1 In Scope
1. **Halaman Katalog (Public)**
   - Grid/list produk digital dengan foto preview, judul, harga (opsional), badge kategori.
   - Klik kartu produk → halaman detail produk.
   - Halaman detail: foto/video, deskripsi, dan tombol **"Kunjungi"** yang membuka link Lynk.id (tab baru).
   - Setiap kali halaman detail dibuka → tercatat sebagai 1 **view**.
   - Setiap kali tombol "Kunjungi" diklik → tercatat sebagai 1 **click**.
2. **Dashboard (Private/Admin)**
   - Login sederhana (basic auth / password tunggal, karena hanya 1 admin).
   - List semua produk + jumlah views & clicks (tabel + grafik sederhana).
   - Form "Tambah Produk Baru":
     - Upload foto preview (wajib).
     - Judul produk, kategori, link Lynk.id (wajib).
     - Deskripsi teks (rich text/markdown).
     - Upload gambar/video tambahan untuk galeri detail (opsional, bisa lebih dari 1).
   - Edit & hapus produk.
3. **Desain visual** menggunakan elemen HTML semantic (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, dll) dan palet warna brand yang sudah ditentukan (lihat DESIGN.md).
4. **Penyimpanan data** (produk + statistik) memakai GitHub repo sebagai "database" (lihat SYS.md untuk mekanisme).

#### 4.2 Out of Scope (versi awal)
- Sistem pembayaran/checkout di website ini (tetap di Lynk.id).
- Multi-admin / role management kompleks.
- Notifikasi email/WhatsApp otomatis.
- SEO advanced, multi-bahasa.

### 5. User Stories
- *Sebagai pengunjung*, saya ingin melihat daftar produk digital dengan cepat agar saya tahu apa yang dijual.
- *Sebagai pengunjung*, saya ingin klik satu tombol jelas untuk membeli/lihat lebih lanjut tanpa bingung.
- *Sebagai admin*, saya ingin menambah produk baru hanya dengan upload foto + isi form, tanpa coding.
- *Sebagai admin*, saya ingin melihat produk mana yang paling banyak dilihat & diklik agar bisa fokus promosi.

### 6. Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Sistem menampilkan katalog produk dalam grid responsif | Must |
| FR-2 | Sistem menampilkan halaman detail per produk (deskripsi + media + tombol kunjungi) | Must |
| FR-3 | Tombol "Kunjungi" mengarahkan ke URL Lynk.id pada tab baru | Must |
| FR-4 | Sistem mencatat 1 view setiap halaman detail dibuka | Must |
| FR-5 | Sistem mencatat 1 click setiap tombol "Kunjungi" ditekan | Must |
| FR-6 | Admin dapat login ke dashboard yang terlindungi | Must |
| FR-7 | Admin dapat menambah produk baru (foto, judul, kategori, link, deskripsi, media tambahan) | Must |
| FR-8 | Admin dapat mengedit & menghapus produk | Should |
| FR-9 | Dashboard menampilkan tabel & grafik ringkas views/clicks per produk | Must |
| FR-10 | Data produk & statistik tersimpan permanen di GitHub repo | Must |

### 7. Non-Functional Requirements
- **Performance**: First load < 3 detik di koneksi mobile biasa.
- **Aksesibilitas**: kontras warna cukup, ukuran tombol mudah disentuh (mobile-first), font terbaca jelas untuk semua umur.
- **Maintainability**: kode berbasis JS, struktur sederhana agar mudah ditambah produk baru tanpa deploy ulang penuh.
- **Compatibility**: berjalan baik di Chrome/Safari mobile (mayoritas pengguna awam pakai HP).
- **Cost**: tanpa biaya hosting server (statis + GitHub sebagai storage).

### 8. Metrik Keberhasilan
- Jumlah views dan click-through rate (CTR = clicks/views) per produk terlihat jelas di dashboard.
- Waktu admin menambah produk baru < 3 menit.

### 9. Asumsi & Batasan
- Hanya 1 admin pemilik toko, tidak perlu sistem registrasi pengguna.
- Pembayaran 100% terjadi di Lynk.id, website ini tidak menyimpan data transaksi.
- Trafik tidak ekstrem tinggi (cocok dengan keterbatasan rate-limit API GitHub, lihat SYS.md).
