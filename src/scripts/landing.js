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

// ============ LOAD SERVICES ============
async function loadServices() {
  const grid = document.getElementById('serviceGrid')

  try {
    const filesRes = await fetch('/data/services')
    const files = filesRes.ok ? await filesRes.json() : []
    const services = []

    for (const file of files) {
      const res = await fetch(`/data/services/${file}`)
      if (res.ok) {
        services.push(await res.json())
      }
    }

    if (services.length === 0) {
      grid.innerHTML = ''
      return
    }

    grid.innerHTML = services.map(s => `
      <article class="service-card" data-id="${s.id}">
        <img
          class="service-card-image"
          src="${s.previewImage || '/placeholder.svg'}"
          alt="${s.title}"
          loading="lazy"
        />
        <div class="service-card-body">
          <h3 class="service-card-title">${s.title}</h3>
          ${s.priceMin || s.priceMax ? `<p class="service-card-price">${s.priceMin ? formatPrice(s.priceMin) : ''}${s.priceMin && s.priceMax ? ' - ' : ''}${s.priceMax ? formatPrice(s.priceMax) : ''}</p>` : ''}
          <p class="service-card-desc">${(s.description || '').replace(/<[^>]*>/g, '').slice(0, 120)}</p>
        </div>
      </article>
    `).join('')

    grid.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', () => {
        const service = services.find(s => s.id === card.dataset.id)
        if (service) openOrderModal(service)
      })
    })

  } catch {
    grid.innerHTML = ''
  }
}

loadServices();

// ============ ORDER MODAL ============
const orderModal = document.getElementById('orderModal')
const orderModalTitle = document.getElementById('orderModalTitle')
const orderForm = document.getElementById('orderForm')
const orderCustomFields = document.getElementById('orderCustomFields')
const orderSuccess = document.getElementById('orderSuccess')
const btnSubmitOrder = document.getElementById('btnSubmitOrder')
let currentService = null

document.getElementById('orderModalClose').addEventListener('click', closeOrderModal)
orderModal.addEventListener('click', e => {
  if (e.target === orderModal) closeOrderModal()
})
document.getElementById('btnOrderAgain').addEventListener('click', () => {
  orderSuccess.style.display = 'none'
  orderForm.style.display = 'block'
  orderForm.reset()
  document.getElementById('orderCustomFields').innerHTML = ''
})

function openOrderModal(service) {
  currentService = service
  orderModalTitle.textContent = `Pesan — ${service.title}`
  document.getElementById('orderServiceId').value = service.id
  orderForm.style.display = 'block'
  orderSuccess.style.display = 'none'
  orderForm.reset()
  btnSubmitOrder.disabled = false
  btnSubmitOrder.textContent = 'Kirim Pesanan'

  // Render custom fields
  orderCustomFields.innerHTML = (service.formFields || []).map(f => {
    if (f.type === 'select') {
      return `
        <div class="form-group">
          <label>${f.label}</label>
          <select class="order-input order-field" data-field-id="${f.id}">
            <option value="">Pilih...</option>
            ${(f.options || []).map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>
        </div>
      `
    }
    if (f.type === 'textarea') {
      return `
        <div class="form-group">
          <label>${f.label}</label>
          <textarea class="order-input order-field" data-field-id="${f.id}" rows="3"></textarea>
        </div>
      `
    }
    return `
      <div class="form-group">
        <label>${f.label}</label>
        <input type="text" class="order-input order-field" data-field-id="${f.id}" />
      </div>
    `
  }).join('')

  orderModal.classList.add('open')
}

function closeOrderModal() {
  orderModal.classList.remove('open')
  currentService = null
}

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const customerName = document.getElementById('orderCustomerName').value.trim()
  const customerWa = document.getElementById('orderCustomerWa').value.trim()
  const serviceId = document.getElementById('orderServiceId').value

  if (!customerName || !customerWa) return

  const answers = {}
  orderCustomFields.querySelectorAll('.order-field').forEach(el => {
    answers[el.dataset.fieldId] = el.value.trim()
  })

  const order = {
    id: 'order_' + Date.now(),
    serviceId,
    serviceTitle: currentService?.title || '',
    customerName,
    customerWa,
    answers,
    serviceFields: currentService?.formFields || [],
  }

  btnSubmitOrder.disabled = true
  btnSubmitOrder.textContent = 'Mengirim...'

  try {
    const res = await fetch('/api/submit-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Gagal mengirim: ' + (err.error || 'Unknown error'))
      btnSubmitOrder.disabled = false
      btnSubmitOrder.textContent = 'Kirim Pesanan'
      return
    }

    orderForm.style.display = 'none'
    orderSuccess.style.display = 'block'
  } catch {
    alert('Gagal terhubung ke server. Coba lagi nanti.')
    btnSubmitOrder.disabled = false
    btnSubmitOrder.textContent = 'Kirim Pesanan'
  }
})

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
