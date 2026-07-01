const API_BASE = '/data/products';

function formatPrice(price) {
  if (!price) return ''
  if (/^(Rp|IDR)/i.test(price.trim())) return price.trim()
  const num = price.replace(/[^0-9]/g, '')
  if (!num) return price.trim()
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

// ============ NAVBAR SCROLL ============
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 80);
});

// ============ SMOOTH SCROLL FOR NAV LINKS ============
document.querySelectorAll('.nav-links a, .footer-col a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// ============ LOAD PRODUCTS ============
async function loadProducts() {
  const grid = document.getElementById('productGrid');

  try {
    const filesRes = await fetch(API_BASE);
    const files = filesRes.ok ? await filesRes.json() : [];

    const products = [];

    for (const file of files) {
      const res = await fetch(`${API_BASE}/${file}`);
      if (res.ok) {
        const product = await res.json();
        products.push(product);
      }
    }

    if (products.length === 0) {
      grid.innerHTML = '<p class="loading-text">Belum ada produk.</p>';
      return;
    }

    grid.innerHTML = products.map(product => `
      <article class="product-card" data-id="${product.id}">
        <img
          class="product-card-image"
          src="${product.previewImage || '/placeholder.svg'}"
          alt="${product.title}"
          loading="lazy"
        />
        <div class="product-card-body">
          <span class="product-card-category">${product.category}</span>
          <h2 class="product-card-title">${product.title}</h2>
          ${product.price ? `<p class="product-card-price">${formatPrice(product.price)}</p>` : ''}
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `/detail.html?id=${card.dataset.id}`;
      });
    });

  } catch (err) {
    grid.innerHTML = '<p class="loading-text">Gagal memuat produk. Coba lagi nanti.</p>';
  }
}

loadProducts();

// ============ CONTACT FORM ============
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Terkirim!';
    btn.disabled = true;
    setTimeout(() => {
      contactForm.reset();
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2500);
  });
}
