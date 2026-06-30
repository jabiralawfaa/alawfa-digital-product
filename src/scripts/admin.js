const API_BASE = '/data/products';

async function loadDashboard() {
  const files = [
    'ebook-resep-keluarga.json',
    'template-cv-modern.json',
  ];

  try {
    const products = [];

    for (const file of files) {
      const res = await fetch(`${API_BASE}/${file}`);
      if (res.ok) {
        const product = await res.json();
        products.push(product);
      }
    }

    const statsRes = await fetch('/data/stats.json');
    const stats = statsRes.ok ? await statsRes.json() : {};

    renderStats(products, stats);
    renderTable(products, stats);

  } catch (err) {
    document.getElementById('productTableBody').innerHTML =
      '<tr><td colspan="6">Gagal memuat data.</td></tr>';
  }
}

function renderStats(products, stats) {
  let totalViews = 0;
  let totalClicks = 0;

  products.forEach(p => {
    const s = stats[p.id] || { views: 0, clicks: 0 };
    totalViews += s.views;
    totalClicks += s.clicks;
  });

  const avgCtr = totalViews > 0
    ? ((totalClicks / totalViews) * 100).toFixed(1) + '%'
    : '0%';

  document.getElementById('statTotalProducts').textContent = products.length;
  document.getElementById('statTotalViews').textContent = totalViews;
  document.getElementById('statTotalClicks').textContent = totalClicks;
  document.getElementById('statAvgCtr').textContent = avgCtr;
}

function renderTable(products, stats) {
  const tbody = document.getElementById('productTableBody');

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Belum ada produk.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => {
    const s = stats[p.id] || { views: 0, clicks: 0 };
    const ctr = s.views > 0
      ? ((s.clicks / s.views) * 100).toFixed(1) + '%'
      : '0%';

    return `
      <tr>
        <td><img src="${p.previewImage || '/placeholder.svg'}" alt="${p.title}" /></td>
        <td>${p.title}</td>
        <td>${s.views}</td>
        <td>${s.clicks}</td>
        <td>${ctr}</td>
        <td>
          <button class="btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn-delete" data-id="${p.id}">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

loadDashboard();
