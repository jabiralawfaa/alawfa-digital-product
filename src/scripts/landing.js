// ============ SCROLL ANIMATIONS (IntersectionObserver) ============
const animObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        animObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
)

document.querySelectorAll('[data-animate]').forEach((el) => {
  animObserver.observe(el)
})

// ============ CARD PARALLAX TILT ============
if (window.matchMedia('(min-width: 901px)').matches && !window.matchMedia('(pointer: coarse)').matches) {
  const cards = document.querySelectorAll('.about-card')
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -3
      const rotateY = ((x - centerX) / centerX) * 3
      card.style.transform = `translateY(-6px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    })
    card.addEventListener('mouseleave', () => {
      card.style.transform = ''
    })
  })
}

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

    grid.innerHTML = products.map((product, i) => `
      <article class="product-card" data-id="${product.id}" data-animate>
        <div class="product-card-image">
          <img
            src="${product.previewImage || '/placeholder.svg'}"
            alt="${product.title}"
            loading="lazy"
          />
        </div>
        <div class="product-card-body">
          <p class="product-card-category">${product.category || ''}</p>
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

    // Observe animated elements
    grid.querySelectorAll('[data-animate]').forEach(el => animObserver.observe(el));

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
      <article class="service-card" data-id="${s.id}" data-animate>
        <div class="service-card-image">
          <img
            src="${s.previewImage || '/placeholder.svg'}"
            alt="${s.title}"
            loading="lazy"
          />
        </div>
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

    grid.querySelectorAll('[data-animate]').forEach(el => animObserver.observe(el))

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
  const formCard = document.getElementById('form-card');
  const successMsg = document.getElementById('success-msg');
  const resetBtn = document.getElementById('reset-btn');
  const submitBtn = document.getElementById('submit-btn');

  const inputName = document.getElementById('input-name');
  const inputEmail = document.getElementById('input-email');
  const inputMessage = document.getElementById('input-message');
  const charCounter = document.getElementById('char-counter');

  const groupName = document.getElementById('group-name');
  const groupEmail = document.getElementById('group-email');
  const groupMessage = document.getElementById('group-message');

  // Focus / blur — label style
  ;[inputName, inputEmail, inputMessage].forEach((input) => {
    const group = input.closest('.form-group');
    input.addEventListener('focus', () => {
      group.classList.add('focused');
      group.classList.remove('error');
    });
    input.addEventListener('blur', () => {
      group.classList.remove('focused');
    });
  });

  // Character counter
  inputMessage.addEventListener('input', () => {
    const len = inputMessage.value.length;
    charCounter.textContent = `${len} / 500`;
    charCounter.classList.remove('warn', 'over');
    if (len >= 500) {
      charCounter.classList.add('over');
    } else if (len >= 400) {
      charCounter.classList.add('warn');
    }
  });

  function validateName() {
    const val = inputName.value.trim();
    if (!val) {
      groupName.classList.add('error');
      return false;
    }
    groupName.classList.remove('error');
    return true;
  }

  function validateEmail() {
    const val = inputEmail.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val || !emailRegex.test(val)) {
      groupEmail.classList.add('error');
      return false;
    }
    groupEmail.classList.remove('error');
    return true;
  }

  function validateMessage() {
    const val = inputMessage.value.trim();
    if (!val || val.length < 10) {
      groupMessage.classList.add('error');
      return false;
    }
    groupMessage.classList.remove('error');
    return true;
  }

  // Real-time validation after first error
  inputName.addEventListener('input', () => {
    if (groupName.classList.contains('error')) validateName();
  });
  inputEmail.addEventListener('input', () => {
    if (groupEmail.classList.contains('error')) validateEmail();
  });
  inputMessage.addEventListener('input', () => {
    if (groupMessage.classList.contains('error')) validateMessage();
  });

  // Submit
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isMessageValid = validateMessage();

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      if (!isNameValid) inputName.focus();
      else if (!isEmailValid) inputEmail.focus();
      else inputMessage.focus();
      return;
    }

    submitBtn.classList.add('loading');

    setTimeout(() => {
      submitBtn.classList.remove('loading');
      contactForm.style.display = 'none';
      formCard.classList.add('success');
      successMsg.classList.add('show');
      showToast('Pesan berhasil dikirim', 'fa-solid fa-circle-check', '#4ADE80');
    }, 1500);
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    contactForm.reset();
    charCounter.textContent = '0 / 500';
    charCounter.classList.remove('warn', 'over');
    groupName.classList.remove('error', 'focused');
    groupEmail.classList.remove('error', 'focused');
    groupMessage.classList.remove('error', 'focused');
    formCard.classList.remove('success');
    successMsg.classList.remove('show');
    contactForm.style.display = '';
  });
}

// Toast
const toastContainer = document.getElementById('toast-container');
function showToast(message, icon, color) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="${icon}" style="color:${color}"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// ============ NEWSLETTER FORM ============
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  const newsletterInput = newsletterForm.querySelector('.newsletter-input');
  const footerShakeStyle = document.createElement('style');
  footerShakeStyle.textContent = `@keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }`;
  document.head.appendChild(footerShakeStyle);

  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newsletterForm.style.animation = 'shake 0.4s ease';
      newsletterForm.addEventListener('animationend', () => {
        newsletterForm.style.animation = '';
      }, { once: true });
      newsletterInput.focus();
      return;
    }
    newsletterInput.value = '';
    showToast('Berhasil berlangganan newsletter', 'fa-solid fa-circle-check', '#4ADE80');
  });
}

// ============ BACK TO TOP ============
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
