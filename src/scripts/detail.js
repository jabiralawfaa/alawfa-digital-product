const API_BASE = '/data/products';

function formatPrice(price) {
  if (!price) return ''
  if (/^(Rp|IDR)/i.test(price.trim())) return price.trim()
  const num = price.replace(/[^0-9]/g, '')
  if (!num) return price.trim()
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadDetail() {
  const container = document.getElementById('productDetail');
  const id = getProductId();

  if (!id) {
    container.innerHTML = '<p class="loading-text">Produk tidak ditemukan.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}.json`);
    if (!res.ok) throw new Error('Not found');

    const product = await res.json();

    document.title = `${product.title} — Al-Awfa Digital Product`;

    const galleryHtml = (product.gallery || []).map(src => {
      const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
      return isVideo
        ? `<video src="${src}" controls></video>`
        : `<img src="${src}" alt="Galeri ${product.title}" loading="lazy" />`;
    }).join('');

    container.innerHTML = `
      <figure class="product-detail-figure">
        <img
          src="${product.previewImage || '/placeholder.svg'}"
          alt="${product.title}"
        />
      </figure>

      <header class="product-detail-header">
        <span class="product-detail-category">${product.category}</span>
        <h1 class="product-detail-title">${product.title}</h1>
        ${product.price ? `<p class="product-detail-price">${formatPrice(product.price)}</p>` : ''}
      </header>

      <div class="product-detail-description">
        ${product.description || ''}
      </div>

      ${galleryHtml ? `<div class="product-detail-gallery">${galleryHtml}</div>` : ''}
    `;

    const btnCta = document.getElementById('btnCta');
    btnCta.href = product.lynkUrl;

    btnCta.addEventListener('click', (e) => {
      trackClick(product.id);
    });

    trackView(product.id);

  } catch (err) {
    container.innerHTML = '<p class="loading-text">Produk tidak ditemukan.</p>';
  }
}

function trackView(productId) {
  navigator.sendBeacon('/api/track-view', JSON.stringify({ productId }));
}

function trackClick(productId) {
  navigator.sendBeacon('/api/track-click', JSON.stringify({ productId }));
}

loadDetail();
