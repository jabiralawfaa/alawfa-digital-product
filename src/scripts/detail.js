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

/* =============================================
   SCROLL REVEAL
   ============================================= */
let revealObserver;
const pendingReveal = new Set();

function initRevealObserver() {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (window.__loading) {
            pendingReveal.add(entry.target);
          } else {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => {
    revealObserver.observe(el);
  });
}

initRevealObserver();

if (window.__loading) {
  const poll = setInterval(() => {
    if (!window.__loading) {
      clearInterval(poll);
      pendingReveal.forEach(el => {
        if (el && !el.classList.contains('visible')) {
          el.classList.add('visible');
          revealObserver?.unobserve(el);
        }
      });
      pendingReveal.clear();
    }
  }, 100);
}

function observeAnimated() {
  document.querySelectorAll('[data-animate]').forEach((el) => {
    revealObserver.observe(el);
  });
}

/* =============================================
   TOAST
   ============================================= */
const toastContainer = document.getElementById('toastContainer');

function showToast(message, icon, color) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = color || 'var(--teal)';
  toast.innerHTML = `<i class="${icon}" style="color:${color || 'var(--teal)'}"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

/* =============================================
   LOAD DETAIL
   ============================================= */
async function loadDetail() {
  const id = getProductId();

  if (!id) {
    document.getElementById('productName').textContent = 'Produk tidak ditemukan.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}.json`);
    if (!res.ok) throw new Error('Not found');

    const product = await res.json();

    document.title = `${product.title} — Al-Awfa Digital Product`;

    // Hero image
    const img = document.getElementById('productImage');
    img.src = product.previewImage || '/placeholder.svg';
    img.alt = product.title;

    // Badge
    document.getElementById('badgeText').textContent = product.category || 'Produk';

    // Tag
    document.getElementById('tagText').textContent = product.category || 'Kategori';

    // Name
    document.getElementById('productName').textContent = product.title;

    // Price
    if (product.price) {
      document.getElementById('priceMain').textContent = formatPrice(product.price);
      document.getElementById('productPriceArea').style.display = '';
    } else {
      document.getElementById('productPriceArea').style.display = 'none';
    }

    // CTA button
    const btnCta = document.getElementById('btnCta');
    if (product.lynkUrl) {
      btnCta.style.display = '';
      btnCta.addEventListener('click', () => {
        trackClick(product.id);
        window.open(product.lynkUrl, '_blank', 'noopener');
      });
    } else {
      btnCta.style.display = 'none';
    }

    // Share WA button
    const btnShareWA = document.getElementById('btnShareWA');
    const shareUrl = `${window.location.origin}/detail.html?id=${product.id}`;
    const shareText = `${product.title}\n${shareUrl}`;
    btnShareWA.addEventListener('click', () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
      showToast('Tautan produk disalin ke WhatsApp', 'fa-brands fa-whatsapp', '#25D366');
    });

    // Description
    const descBody = document.getElementById('descBody');
    if (product.description) {
      descBody.innerHTML = product.description;
    } else {
      descBody.innerHTML = '<p>Tidak ada deskripsi untuk produk ini.</p>';
    }

    // Specs — if the product has specs data, we'll show them
    const specsContainer = document.getElementById('descSpecs');
    if (product.specs && product.specs.length > 0) {
      specsContainer.innerHTML = product.specs.map(s => `
        <div class="spec-item">
          <p class="spec-label">${s.label}</p>
          <p class="spec-value">${s.value}</p>
        </div>
      `).join('');
      specsContainer.style.display = '';
    } else {
      specsContainer.style.display = 'none';
    }

    // Gallery
    const galleryGrid = document.getElementById('galleryGrid');
    if (product.gallery && product.gallery.length > 0) {
      galleryGrid.innerHTML = product.gallery.map((src, i) => {
        const isVideo = src.match(/\.(mp4|webm|ogg)$/i);
        return isVideo
          ? `<video src="${src}" controls data-animate></video>`
          : `<img src="${src}" alt="Galeri ${product.title}" loading="lazy" data-animate />`;
      }).join('');
      document.getElementById('productGallery').style.display = '';
    } else {
      document.getElementById('productGallery').style.display = 'none';
    }

    // Observe all animated elements
    observeAnimated();

    trackView(product.id);

  } catch (err) {
    document.getElementById('productName').textContent = 'Produk tidak ditemukan.';
    document.getElementById('productImage').src = '/placeholder.svg';
  }
}

function trackView(productId) {
  navigator.sendBeacon('/api/track-view', JSON.stringify({ productId }));
}

function trackClick(productId) {
  navigator.sendBeacon('/api/track-click', JSON.stringify({ productId }));
}

loadDetail();
