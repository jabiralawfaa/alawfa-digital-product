# SYS.md
## Arsitektur Sistem — Showcase Produk Digital (GitHub sebagai Storage)

### 1. Gambaran Umum
Website ini adalah aplikasi **JAMstack** (JavaScript, API, Markup) — tidak ada server/database tradisional. Semua data produk dan statistik (views/clicks) disimpan sebagai file (JSON/Markdown) **langsung di dalam GitHub repo**, lalu dibaca oleh frontend melalui GitHub API atau file statis hasil build.

Karena menulis (commit) ke GitHub repo butuh *token* rahasia yang **tidak boleh** ditaruh di kode frontend (browser), maka proses **tulis data** (tambah produk, update views/clicks) dilakukan lewat satu **Serverless Function** kecil sebagai perantara aman, bukan langsung dari browser ke GitHub.

### 2. Komponen Utama

| Komponen | Peran | Contoh Teknologi |
|---|---|---|
| **Frontend Publik** | Halaman katalog & detail produk | HTML/CSS/JS (Vite/Next.js/Astro) |
| **Dashboard Admin** | UI tambah/edit produk, lihat statistik | React/Vue + auth sederhana |
| **Serverless Function (Proxy aman)** | Menjembatani Frontend ↔ GitHub API agar token tidak terekspos | Vercel/Netlify/Cloudflare Functions |
| **GitHub Repo (sebagai "Database")** | Menyimpan `products/*.json`, `stats.json`, file media | Repo GitHub + GitHub REST API (`@octokit/rest`) |
| **GitHub Pages / Vercel/Netlify Hosting** | Hosting situs statis hasil build | GitHub Pages, atau Vercel/Netlify (gratis) |
| **Lynk.id** | Tujuan akhir redirect (checkout produk) | Eksternal, tidak dikelola sistem ini |

> Catatan paket npm yang relevan dengan ide "GitHub jadi storage":
> - `@octokit/rest` — membaca/menulis file ke repo lewat GitHub API (paling fleksibel & yang dipakai di desain ini).
> - Alternatif siap-pakai: **Decap CMS** (dulu Netlify CMS) — CMS git-based yang langsung commit konten ke repo, cocok untuk dashboard tambah produk tanpa membangun proxy sendiri.
> - `simple-git` — jika ingin operasi git dari server (kurang cocok untuk serverless, karena perlu clone repo).

### 3. Diagram Arsitektur (High-Level)

```mermaid
flowchart TB
    subgraph Client["Browser Pengguna"]
        A[Halaman Katalog]
        B[Halaman Detail Produk]
        C[Tombol 'Kunjungi']
    end

    subgraph Admin["Browser Admin"]
        D[Dashboard: Lihat Statistik]
        E[Form: Tambah/Edit Produk]
    end

    subgraph Edge["Serverless Function (Proxy Aman)"]
        F["/api/track-view"]
        G["/api/track-click"]
        H["/api/save-product"]
    end

    subgraph GH["GitHub Repo (Storage)"]
        I[(products/*.json)]
        J[(stats.json)]
        K[(media/ - foto & video)]
    end

    subgraph Ext["Eksternal"]
        L[Lynk.id - Halaman Checkout]
    end

    A -- "fetch data produk (build-time / GitHub API)" --> I
    B -- "buka halaman" --> F
    F -- "update counter view" --> J
    C -- "klik tombol" --> G
    G -- "update counter click" --> J
    C -- "redirect" --> L

    E -- "submit foto + form" --> H
    H -- "commit file JSON + upload media" --> I
    H --> K
    D -- "fetch statistik" --> J

    style I fill:#08D9D6,color:#252A34
    style J fill:#08D9D6,color:#252A34
    style K fill:#08D9D6,color:#252A34
    style L fill:#FF2E63,color:#EAEAEA
```

### 4. Diagram Alur Data Produk (Sequence — Tambah Produk Baru)

```mermaid
sequenceDiagram
    actor Admin
    participant Dash as Dashboard (Browser)
    participant Func as Serverless Function
    participant GH as GitHub API
    participant Repo as GitHub Repo

    Admin->>Dash: Isi form (foto, judul, kategori, link Lynk.id, deskripsi)
    Dash->>Func: POST /api/save-product (data + file foto, base64)
    Func->>GH: PUT contents/media/{slug}.jpg
    GH->>Repo: Commit file foto
    Func->>GH: PUT contents/products/{slug}.json
    GH->>Repo: Commit data produk (judul, link, deskripsi, dst)
    Repo-->>Func: Commit SHA / sukses
    Func-->>Dash: Response sukses
    Dash-->>Admin: Notifikasi "Produk berhasil ditambahkan"
```

### 5. Diagram Alur Tracking Views & Clicks

```mermaid
sequenceDiagram
    actor User as Pengunjung
    participant Detail as Halaman Detail Produk
    participant Func as Serverless Function
    participant Repo as GitHub Repo (stats.json)
    participant Lynk as Lynk.id

    User->>Detail: Buka halaman produk
    Detail->>Func: POST /api/track-view {productId}
    Func->>Repo: Baca stats.json -> tambah views +1 -> commit
    User->>Detail: Klik tombol "Kunjungi"
    Detail->>Func: POST /api/track-click {productId}
    Func->>Repo: Baca stats.json -> tambah clicks +1 -> commit
    Detail->>Lynk: window.open(linkLynk, '_blank')
```

> **Catatan teknis penting**: Setiap "click" tidak menunggu response commit selesai sebelum redirect (pakai `navigator.sendBeacon()` atau fire-and-forget fetch) agar pengalaman pengguna tidak terasa lambat saat pindah ke Lynk.id.

### 6. Struktur Folder Repo (Contoh)

```
repo-root/
├─ data/
│  ├─ products/
│  │  ├─ ebook-resep-keluarga.json
│  │  └─ template-cv-modern.json
│  └─ stats.json          ← { "ebook-resep-keluarga": { "views": 120, "clicks": 34 }, ... }
├─ media/
│  ├─ ebook-resep-keluarga/
│  │  ├─ preview.jpg
│  │  └─ galeri-1.mp4
├─ functions/              ← serverless functions
│  ├─ save-product.js
│  ├─ track-view.js
│  └─ track-click.js
├─ src/                    ← frontend (komponen, halaman)
└─ public/ (jika pakai GitHub Pages sebagai host akhir)
```

Contoh isi `products/ebook-resep-keluarga.json`:
```json
{
  "id": "ebook-resep-keluarga",
  "title": "Ebook Resep Keluarga Sehat",
  "category": "Ebook",
  "previewImage": "/media/ebook-resep-keluarga/preview.jpg",
  "description": "Kumpulan 50 resep sehat untuk keluarga...",
  "gallery": ["/media/ebook-resep-keluarga/galeri-1.mp4"],
  "lynkUrl": "https://lynk.id/namauser/ebook-resep-keluarga",
  "createdAt": "2026-06-20T10:00:00Z"
}
```

### 7. Keamanan
- Token GitHub (Personal Access Token / GitHub App) **hanya disimpan sebagai environment variable di serverless function**, tidak pernah dikirim ke browser.
- Dashboard admin dilindungi minimal dengan password tunggal/JWT sederhana sebelum bisa memanggil `/api/save-product`.
- Validasi ukuran & tipe file upload (foto/video) sebelum dikirim ke GitHub API (batas ukuran file GitHub API per request ~ beberapa MB; untuk video besar bisa dialihkan ke layanan hosting media lain jika diperlukan ke depannya).

### 8. Pertimbangan Skalabilitas
- GitHub API punya **rate limit** (umumnya 5000 request/jam dengan token autentikasi) — cukup untuk trafik kecil-menengah, tapi setiap "view" yang melakukan commit langsung bisa cepat menghabiskan limit/membuat history commit penuh "noise".
- **Rekomendasi**: untuk counter views/clicks, jangan commit langsung per klik. Gunakan salah satu strategi:
  1. **Batching**: kumpulkan event di memory/queue ringan, lalu commit gabungan tiap beberapa menit (lewat scheduled function / GitHub Actions cron).
  2. Atau ganti `stats.json` di GitHub dengan layanan counter ringan terpisah (misal Cloudflare KV/Upstash Redis) khusus untuk angka yang sering berubah, sementara data produk (yang jarang berubah) tetap di GitHub repo.
- Pilihan akhir tetap "GitHub sebagai storage" untuk **data produk** sangat cocok (jarang berubah), sedangkan untuk **counter** disarankan dievaluasi lagi saat trafik mulai ramai.

### 9. Deployment Singkat
1. Push kode ke GitHub repo.
2. Hubungkan repo ke Vercel/Netlify → auto build & deploy frontend + serverless functions.
3. Set environment variable `GITHUB_TOKEN`, `GITHUB_REPO`, `ADMIN_PASSWORD` di dashboard hosting (bukan di kode).
4. Setiap admin menambah produk → otomatis commit ke repo → frontend yang fetch data langsung dari GitHub API akan menampilkan data terbaru (atau trigger rebuild jika pakai static-site generator).
