const API_BASE = '/data/products'
const STATS_URL = '/data/stats.json'
const LANDING_URL = '/data/landing.json'
const ADMIN_PASSWORD = sessionStorage.getItem('admin_auth')

// ============ AUTH CHECK ============
if (!ADMIN_PASSWORD) {
  window.location.href = '/admin/login.html'
}

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_PASSWORD}`,
  }
}

// ============ SECTION SWITCHING ============
const sections = {
  overview: document.getElementById('section-overview'),
  products: document.getElementById('section-products'),
  landing: document.getElementById('section-landing'),
  media: document.getElementById('section-media'),
}

document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault()
    const section = link.dataset.section

    if (section === 'logout') {
      sessionStorage.removeItem('admin_auth')
      window.location.href = '/admin/login.html'
      return
    }

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'))
    link.classList.add('active')
    Object.values(sections).forEach(s => s.classList.remove('active'))
    sections[section].classList.add('active')
    if (section === 'media') loadMedia(document.getElementById('searchMedia').value)
  })
})

// ============ LOAD ALL DATA ============
let allProducts = []
let allStats = {}
let allLanding = {}

async function loadData() {
  try {
    const filesRes = await fetch(API_BASE)
    const files = filesRes.ok ? await filesRes.json() : []
    allProducts = []

    for (const file of files) {
      const res = await fetch(`${API_BASE}/${file}`)
      if (res.ok) {
        allProducts.push(await res.json())
      }
    }

    const statsRes = await fetch(STATS_URL)
    allStats = statsRes.ok ? await statsRes.json() : {}

    const landingRes = await fetch(LANDING_URL)
    allLanding = landingRes.ok ? await landingRes.json() : {}
  } catch (err) {
    console.error('Gagal memuat data:', err)
  }
}

// ============ OVERVIEW ============
function renderOverview() {
  let totalViews = 0
  let totalClicks = 0

  allProducts.forEach(p => {
    const s = allStats[p.id] || { views: 0, clicks: 0 }
    totalViews += s.views
    totalClicks += s.clicks
  })

  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) + '%' : '0%'

  document.getElementById('statTotalProducts').textContent = allProducts.length
  document.getElementById('statTotalViews').textContent = totalViews
  document.getElementById('statTotalClicks').textContent = totalClicks
  document.getElementById('statAvgCtr').textContent = avgCtr

  const tbody = document.getElementById('overviewTableBody')
  if (allProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Belum ada produk.</td></tr>'
    return
  }

  tbody.innerHTML = allProducts.map(p => {
    const s = allStats[p.id] || { views: 0, clicks: 0 }
    const ctr = s.views > 0 ? ((s.clicks / s.views) * 100).toFixed(1) + '%' : '0%'
    return `
      <tr>
        <td><img src="${p.previewImage || '/placeholder.svg'}" alt="${p.title}" /></td>
        <td>${p.title}</td>
        <td>${p.category || '-'}</td>
        <td>${s.views}</td>
        <td>${s.clicks}</td>
        <td>${ctr}</td>
      </tr>
    `
  }).join('')
}

// ============ PRODUCTS ============
function renderProductTable(filter = '') {
  const tbody = document.getElementById('productTableBody')
  const filtered = filter
    ? allProducts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()))
    : allProducts

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">Tidak ada produk ditemukan.</td></tr>'
    return
  }

  tbody.innerHTML = filtered.map(p => {
    const s = allStats[p.id] || { views: 0, clicks: 0 }
    const ctr = s.views > 0 ? ((s.clicks / s.views) * 100).toFixed(1) + '%' : '0%'
    return `
      <tr>
        <td><img src="${p.previewImage || '/placeholder.svg'}" alt="${p.title}" /></td>
        <td><strong>${p.title}</strong></td>
        <td>${p.category || '-'}</td>
        <td>${s.views}</td>
        <td>${s.clicks}</td>
        <td>${ctr}</td>
        <td>
          <button class="btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn-delete" data-id="${p.id}">Hapus</button>
        </td>
      </tr>
    `
  }).join('')

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id))
  })
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id))
  })
}

document.getElementById('searchProduct').addEventListener('input', e => {
  renderProductTable(e.target.value)
})

// ============ PRODUCT CRUD MODAL ============
const modal = document.getElementById('productModal')
const modalTitle = document.getElementById('modalTitle')
const productForm = document.getElementById('productForm')
const btnSubmit = document.getElementById('btnSubmitProduct')

let editingId = null
let descEditorInited = false

function initDescEditor() {
  if (descEditorInited || typeof hugeRTE === 'undefined') return
  descEditorInited = true
  hugeRTE.init({
    selector: '#formDescription',
    height: 350,
    menubar: false,
    plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
    toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image browseMedia link code',
    content_style: 'body { font-family: Inter, sans-serif; font-size: 14px; }',
    automatic_uploads: true,
    setup: (editor) => {
      editor.ui.registry.addButton('browseMedia', {
        text: 'Browse',
        tooltip: 'Cari Media',
        onAction: () => {
          openMediaTarget = '__editor__'
          const modal = document.getElementById('mediaModal')
          modal.classList.add('open')
          loadMedia(document.getElementById('searchMediaModal').value).then(() => {
            renderMediaGrid('mediaModalGrid', '', true)
          })
        },
      })
    },
    images_upload_handler: (blobInfo) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blobInfo.blob())
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1]
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('admin_auth')}`,
            },
            body: JSON.stringify({ file: base64, name: blobInfo.filename() }),
          })
          if (!res.ok) {
            const err = await res.json()
            reject(new Error(err.error || 'Upload failed'))
            return
          }
          const { url } = await res.json()
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
    }),
  })
}

// ============ FILE UPLOAD ============
document.querySelectorAll('.btn-upload').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target
    const accept = btn.dataset.accept || '*/*'
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.addEventListener('change', async () => {
      const file = input.files[0]
      if (!file) return
      const origText = btn.textContent
      btn.disabled = true
      btn.textContent = 'Mengunggah...'
      try {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        await new Promise(r => { reader.onload = r })
        const base64 = reader.result.split(',')[1]
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ file: base64, name: file.name }),
        })
        if (!res.ok) {
          const err = await res.json()
          alert('Gagal upload: ' + (err.error || 'Unknown'))
          return
        }
        const { url } = await res.json()
        const target = document.getElementById(targetId)
        if (targetId === 'formGallery') {
          const existing = target.value.trim()
          target.value = existing ? existing + ', ' + url : url
        } else {
          target.value = url
        }
      } catch (err) {
        alert('Gagal upload: ' + err.message)
      } finally {
        btn.disabled = false
        btn.textContent = origText
        input.remove()
      }
    })
    document.body.appendChild(input)
    input.click()
  })
})

document.getElementById('btnAddProduct').addEventListener('click', () => openAddModal())
document.getElementById('modalClose').addEventListener('click', closeModal)
modal.addEventListener('click', e => {
  if (e.target === modal) closeModal()
})

function openAddModal() {
  editingId = null
  modalTitle.textContent = 'Tambah Produk Baru'
  productForm.reset()
  document.getElementById('productId').value = ''
  btnSubmit.textContent = 'Simpan Produk'
  const descEditor = hugeRTE && hugeRTE.get('formDescription')
  if (descEditor) descEditor.setContent('')
  modal.classList.add('open')
  setTimeout(initDescEditor, 100)
}

function openEditModal(id) {
  editingId = id
  modalTitle.textContent = 'Edit Produk'
  const product = allProducts.find(p => p.id === id)
  if (!product) return

  document.getElementById('productId').value = product.id
  document.getElementById('formTitle').value = product.title || ''
  document.getElementById('formCategory').value = product.category || ''
  document.getElementById('formPrice').value = product.price || ''
  document.getElementById('formLynkUrl').value = product.lynkUrl || ''
  document.getElementById('formPreviewImage').value = product.previewImage || ''
  const descEditor = hugeRTE && hugeRTE.get('formDescription')
  if (descEditor) {
    descEditor.setContent(product.description || '')
  } else {
    document.getElementById('formDescription').value = product.description || ''
  }
  document.getElementById('formGallery').value = (product.gallery || []).join(', ')
  btnSubmit.textContent = 'Update Produk'
  modal.classList.add('open')
  setTimeout(initDescEditor, 100)
}

function closeModal() {
  modal.classList.remove('open')
  editingId = null
  const descEditor = hugeRTE && hugeRTE.get('formDescription')
  if (descEditor) descEditor.setContent('')
}

productForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const id = editingId || generateId(document.getElementById('formTitle').value)

  const product = {
    id,
    title: document.getElementById('formTitle').value.trim(),
    category: document.getElementById('formCategory').value.trim(),
    price: document.getElementById('formPrice').value.trim(),
    lynkUrl: document.getElementById('formLynkUrl').value.trim(),
    previewImage: document.getElementById('formPreviewImage').value.trim() || '/placeholder.svg',
    description: (hugeRTE && hugeRTE.get('formDescription')
      ? hugeRTE.get('formDescription').getContent()
      : document.getElementById('formDescription').value
    ).trim(),
    gallery: document.getElementById('formGallery').value.split(',').map(s => s.trim()).filter(Boolean),
    createdAt: editingId ? undefined : new Date().toISOString(),
  }

  if (!editingId) {
    product.createdAt = new Date().toISOString()
  }

  btnSubmit.disabled = true
  btnSubmit.textContent = 'Menyimpan...'

  try {
    const res = await fetch('/api/save-product', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ product }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Gagal menyimpan: ' + (err.error || 'Unknown error'))
      return
    }

    closeModal()
    await refreshData()

  } catch (err) {
    alert('Gagal menyimpan: ' + err.message)
  } finally {
    btnSubmit.disabled = false
    btnSubmit.textContent = editingId ? 'Update Produk' : 'Simpan Produk'
  }
})

function generateId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'produk-' + Date.now()
}

async function deleteProduct(id) {
  if (!confirm(`Hapus produk "${allProducts.find(p => p.id === id)?.title}"?`)) return

  try {
    const res = await fetch('/api/delete-product', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ productId: id }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Gagal menghapus: ' + (err.error || 'Unknown error'))
      return
    }

    await refreshData()
  } catch (err) {
    alert('Gagal menghapus: ' + err.message)
  }
}

// ============ LANDING PAGE EDITOR ============
function loadLandingEditor() {
  if (!allLanding) return

  document.getElementById('landingHeroTitle').value = allLanding.hero?.title || ''
  document.getElementById('landingHeroSubtitle').value = allLanding.hero?.subtitle || ''
  document.getElementById('landingAboutHeading').value = allLanding.about?.heading || ''

  const cards = allLanding.about?.cards || []
  document.querySelectorAll('.about-card-editor').forEach((el, i) => {
    const card = cards[i]
    if (card) {
      el.querySelector('.about-card-title').value = card.title || ''
      el.querySelector('.about-card-desc').value = card.description || ''
    }
  })

  document.getElementById('landingContactEmail').value = allLanding.contact?.email || ''
  document.getElementById('landingContactLynk').value = allLanding.contact?.lynkUrl || ''
  document.getElementById('landingFooterCopyright').value = allLanding.footer?.copyright || ''
}

document.getElementById('btnSaveLanding').addEventListener('click', async () => {
  const data = {
    hero: {
      title: document.getElementById('landingHeroTitle').value,
      subtitle: document.getElementById('landingHeroSubtitle').value,
    },
    about: {
      heading: document.getElementById('landingAboutHeading').value,
      cards: Array.from(document.querySelectorAll('.about-card-editor')).map(el => ({
        title: el.querySelector('.about-card-title').value,
        description: el.querySelector('.about-card-desc').value,
      })),
    },
    contact: {
      email: document.getElementById('landingContactEmail').value,
      lynkUrl: document.getElementById('landingContactLynk').value,
    },
    footer: {
      copyright: document.getElementById('landingFooterCopyright').value,
    },
  }

  const statusEl = document.getElementById('landingSaveStatus')
  statusEl.textContent = 'Menyimpan...'
  const btn = document.getElementById('btnSaveLanding')
  btn.disabled = true

  try {
    const res = await fetch('/api/save-landing', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ landing: data }),
    })

    if (res.ok) {
      statusEl.textContent = 'Tersimpan!'
      setTimeout(() => { statusEl.textContent = '' }, 3000)
    } else {
      const err = await res.json()
      statusEl.textContent = 'Gagal: ' + (err.error || 'Error')
    }
  } catch (err) {
    statusEl.textContent = 'Gagal: ' + err.message
  } finally {
    btn.disabled = false
  }
})

// ============ MEDIA LIBRARY ============
let allMedia = []

async function loadMedia(search = '') {
  try {
    const res = await fetch('/media')
    allMedia = res.ok ? await res.json() : []
  } catch {
    allMedia = []
  }
  renderMediaGrid('mediaGrid', search, false)
}

function renderMediaGrid(gridId, search = '', selectable = false) {
  const grid = document.getElementById(gridId)
  const filtered = search
    ? allMedia.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : allMedia

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="loading-text">Belum ada media.</p>'
    return
  }

  grid.innerHTML = filtered.map(m => {
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(m.name)
    return `<div class="media-item" data-url="${m.url}">
      ${isImage
        ? `<img src="${m.url}" alt="${m.name}" loading="lazy" />`
        : `<video src="${m.url}" muted preload="metadata"></video>`
      }
      <div class="media-name">${m.name}</div>
      <div class="media-check">&#10003;</div>
    </div>`
  }).join('')

  grid.querySelectorAll('.media-item').forEach(el => {
    el.addEventListener('click', () => {
      if (selectable) {
        grid.querySelectorAll('.media-item').forEach(x => x.classList.remove('selected'))
        el.classList.add('selected')
      }
      const url = el.dataset.url
      navigator.clipboard.writeText(url).catch(() => {})
      openMediaTarget && insertMediaToTarget(url)
    })
  })
}

let openMediaTarget = null

function insertMediaToTarget(url) {
  if (openMediaTarget === '__editor__') {
    const editor = hugeRTE && hugeRTE.get('formDescription')
    if (editor) {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
      editor.insertContent(isImage
        ? `<img src="${url}" alt="" style="max-width:100%" />`
        : `<video src="${url}" controls style="max-width:100%"></video>`
      )
    }
    openMediaTarget = null
    document.getElementById('mediaModal').classList.remove('open')
    return
  }
  const target = document.getElementById(openMediaTarget)
  if (!target) return
  if (openMediaTarget === 'formGallery') {
    const existing = target.value.trim()
    target.value = existing ? existing + ', ' + url : url
  } else {
    target.value = url
  }
  openMediaTarget = null
  document.getElementById('mediaModal').classList.remove('open')
}

document.querySelectorAll('.btn-browse').forEach(btn => {
  btn.addEventListener('click', () => {
    openMediaTarget = btn.dataset.target
    const modal = document.getElementById('mediaModal')
    modal.classList.add('open')
    loadMedia(document.getElementById('searchMediaModal').value).then(() => {
      renderMediaGrid('mediaModalGrid', '', true)
    })
  })
})

const mediaModal = document.getElementById('mediaModal')
document.getElementById('mediaModalClose').addEventListener('click', () => {
  mediaModal.classList.remove('open')
  openMediaTarget = null
})
mediaModal.addEventListener('click', e => {
  if (e.target === mediaModal) {
    mediaModal.classList.remove('open')
    openMediaTarget = null
  }
})

document.getElementById('searchMediaModal').addEventListener('input', e => {
  renderMediaGrid('mediaModalGrid', e.target.value, true)
})

// Section media
document.getElementById('searchMedia').addEventListener('input', e => {
  renderMediaGrid('mediaGrid', e.target.value, false)
})

document.getElementById('btnUploadMedia').addEventListener('click', () => {
  document.getElementById('uploadMediaBtn').click()
})

document.getElementById('uploadMediaBtn').addEventListener('change', async () => {
  const file = document.getElementById('uploadMediaBtn').files[0]
  if (!file) return
  const btn = document.getElementById('btnUploadMedia')
  btn.disabled = true
  btn.textContent = 'Mengunggah...'
  try {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    await new Promise(r => { reader.onload = r })
    const base64 = reader.result.split(',')[1]
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ file: base64, name: file.name }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert('Gagal upload: ' + (err.error || 'Unknown'))
      return
    }
    await loadMedia(document.getElementById('searchMedia').value)
  } catch (err) {
    alert('Gagal upload: ' + err.message)
  } finally {
    btn.disabled = false
    btn.textContent = '+ Upload Baru'
    document.getElementById('uploadMediaBtn').value = ''
  }
})

// ============ REFRESH ============
async function refreshData() {
  await loadData()
  renderOverview()
  renderProductTable(document.getElementById('searchProduct').value)
  loadLandingEditor()
}

// ============ INIT ============
async function init() {
  await loadData()
  renderOverview()
  renderProductTable()
  loadLandingEditor()

  // Init WYSIWYG
  if (typeof hugeRTE !== 'undefined') {
    hugeRTE.init({
      selector: '#landingHeroEditor',
      height: 300,
      menubar: false,
      plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
    toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image browseMedia link code',
      content_style: 'body { font-family: Inter, sans-serif; font-size: 14px; }',
    })

  }
}

init()
