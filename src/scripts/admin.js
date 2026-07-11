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

// ============ SECTION SWITCHING UPDATE ============
sections.services = document.getElementById('section-services')
sections.orders = document.getElementById('section-orders')

const origClick = document.querySelector('.sidebar-nav a[data-section]')?.click
document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
  const section = link.dataset.section
  if (section === 'services') {
    link.addEventListener('click', () => { setTimeout(loadServices, 50) })
  }
  if (section === 'orders') {
    link.addEventListener('click', () => { setTimeout(loadOrders, 50) })
  }
})

// ============ TAGS ============
let allTags = []

async function loadTags() {
  try {
    const filesRes = await fetch('/data/tags')
    const files = filesRes.ok ? await filesRes.json() : []
    allTags = []
    for (const file of files) {
      const res = await fetch(`/data/tags/${file}`)
      if (res.ok) allTags.push(await res.json())
    }
    renderTagTable()
    renderServiceTagCheckboxes(allTags)
  } catch {
    allTags = []
    document.getElementById('tagTableBody').innerHTML = '<tr><td colspan="4">Gagal memuat tag.</td></tr>'
  }
}

function renderTagTable() {
  const tbody = document.getElementById('tagTableBody')
  if (allTags.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Belum ada tag. Klik "Buat Tag" untuk menambah.</td></tr>'
    return
  }
  tbody.innerHTML = allTags.map(t => {
    const hasIcon = t.icon && t.icon.trim()
    return `<tr>
      <td>${hasIcon ? t.icon : '<span style="opacity:0.4;font-size:22px">&#9679;</span>'}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.purpose || '-'}</td>
      <td><button class="btn-delete" data-id="${t.id}">Hapus</button></td>
    </tr>`
  }).join('')
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTag(btn.dataset.id))
  })
}

function renderServiceTagCheckboxes(tags) {
  const container = document.getElementById('serviceFormTags')
  if (!container) return
  if (!tags || tags.length === 0) {
    container.innerHTML = '<p style="font-size:0.875rem;opacity:0.6">Belum ada tag. Buat tag terlebih dahulu.</p>'
    return
  }
  container.innerHTML = tags.map(t => `
    <label class="tag-checkbox-label">
      <input type="checkbox" class="service-tag-cb" value="${t.id}" />
      ${t.icon && t.icon.trim() ? t.icon : '<span style="opacity:0.5">&#9679;</span>'}
      ${t.name}
    </label>
  `).join('')
}

function collectSelectedTags() {
  const cbs = document.querySelectorAll('.service-tag-cb:checked')
  return Array.from(cbs).map(cb => cb.value)
}

// Tag Modal
const tagModal = document.getElementById('tagModal')
const tagModalTitle = document.getElementById('tagModalTitle')
const tagForm = document.getElementById('tagForm')
const btnSubmitTag = document.getElementById('btnSubmitTag')
let editingTagId = null

document.getElementById('btnAddTag').addEventListener('click', () => openAddTagModal())
document.getElementById('tagModalClose').addEventListener('click', () => closeTagModal())
tagModal.addEventListener('click', e => { if (e.target === tagModal) closeTagModal() })

function openAddTagModal() {
  editingTagId = null
  tagModalTitle.textContent = 'Buat Tag Baru'
  tagForm.reset()
  document.getElementById('tagId').value = ''
  btnSubmitTag.textContent = 'Simpan Tag'
  tagModal.classList.add('open')
}

function closeTagModal() {
  tagModal.classList.remove('open')
  editingTagId = null
}

tagForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = document.getElementById('tagFormName').value.trim()
  const purpose = document.getElementById('tagFormPurpose').value.trim()
  const icon = document.getElementById('tagFormIcon').value.trim()

  if (!name) { alert('Nama tag wajib diisi'); return }

  const id = editingTagId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tag-' + Date.now()

  // Sanitize SVG: only allow <svg>, <path>, <circle>, <rect>, <line>, <polyline>, <polygon>, <g>, <defs>, <linearGradient>, <stop>, <ellipse> and safe attributes
  let safeIcon = ''
  if (icon) {
    const allowedTags = ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'linearGradient', 'stop', 'ellipse', 'text', 'tspan']
    const allowedAttrs = /^(fill|stroke|stroke-width|viewBox|d|cx|cy|r|x|y|width|height|rx|ry|points|x1|y1|x2|y2|opacity|transform|style|stop-color|offset|text-anchor|font-size|font-family|font-weight|class|id|xmlns|version|preserveAspectRatio|data-[a-z-]+)$/i
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(icon, 'text/html')
      const svg = doc.body.querySelector('svg')
      if (svg) {
        const clean = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        Array.from(svg.attributes).forEach(attr => {
          if (allowedAttrs.test(attr.name)) clean.setAttribute(attr.name, attr.value)
        })
        function cleanChildren(src, dest) {
          Array.from(src.childNodes).forEach(child => {
            if (child.nodeType === 3) { dest.appendChild(document.createTextNode(child.textContent)); return }
            if (child.nodeType !== 1) return
            const tag = child.tagName.toLowerCase()
            if (!allowedTags.includes(tag)) return
            const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
            Array.from(child.attributes).forEach(attr => {
              if (allowedAttrs.test(attr.name)) el.setAttribute(attr.name, attr.value)
            })
            if (child.childNodes.length > 0) cleanChildren(child, el)
            dest.appendChild(el)
          })
        }
        cleanChildren(svg, clean)
        safeIcon = clean.outerHTML
      }
    } catch {}
  }

  const tag = { id, name, purpose, icon: safeIcon }

  btnSubmitTag.disabled = true
  btnSubmitTag.textContent = 'Menyimpan...'

  try {
    const res = await fetch('/api/save-tag', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ tag }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert('Gagal menyimpan: ' + (err.error || 'Unknown error'))
      return
    }
    closeTagModal()
    await loadTags()
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message)
  } finally {
    btnSubmitTag.disabled = false
    btnSubmitTag.textContent = 'Simpan Tag'
  }
})

async function deleteTag(id) {
  const tag = allTags.find(t => t.id === id)
  if (!confirm(`Hapus tag "${tag?.name}"?`)) return
  try {
    const res = await fetch('/api/delete-tag', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ tagId: id }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert('Gagal menghapus: ' + (err.error || 'Unknown error'))
      return
    }
    await loadTags()
  } catch (err) {
    alert('Gagal menghapus: ' + err.message)
  }
}

// ============ SERVICES ============
let allServices = []

async function loadServices() {
  try {
    const filesRes = await fetch('/data/services')
    const files = filesRes.ok ? await filesRes.json() : []
    allServices = []
    for (const file of files) {
      const res = await fetch(`/data/services/${file}`)
      if (res.ok) allServices.push(await res.json())
    }
    renderServiceTable(document.getElementById('searchService').value)
  } catch {
    allServices = []
    document.getElementById('serviceTableBody').innerHTML = '<tr><td colspan="6">Gagal memuat data.</td></tr>'
  }
}

function renderServiceTable(filter = '') {
  const tbody = document.getElementById('serviceTableBody')
  const filtered = filter
    ? allServices.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()))
    : allServices

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Belum ada jasa.</td></tr>'
    return
  }

  tbody.innerHTML = filtered.map(s => {
    const tagNames = (s.tags || []).map(tid => {
      const t = allTags.find(tg => tg.id === tid)
      return t ? t.name : tid
    }).join(', ')
    return `<tr>
      <td><img src="${s.previewImage || '/placeholder.svg'}" alt="${s.title}" /></td>
      <td><strong>${s.title}</strong></td>
      <td>${s.price || '-'}</td>
      <td>${tagNames || '-'}</td>
      <td>${(s.formFields || []).length} pertanyaan</td>
      <td>
        <button class="btn-edit" data-id="${s.id}">Edit</button>
        <button class="btn-delete" data-id="${s.id}">Hapus</button>
      </td>
    </tr>`
  }).join('')

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditServiceModal(btn.dataset.id))
  })
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteService(btn.dataset.id))
  })
}

document.getElementById('searchService').addEventListener('input', e => {
  renderServiceTable(e.target.value)
})

// ============ SERVICE FORM FIELDS ============
function renderFormFields(fields) {
  const container = document.getElementById('formFieldsContainer')
  if (!fields || fields.length === 0) {
    container.innerHTML = '<p style="font-size:0.875rem;opacity:0.6">Belum ada pertanyaan. Klik tombol di bawah untuk menambah.</p>'
    return
  }

  container.innerHTML = fields.map((f, i) => `
    <div class="form-field-item" data-index="${i}">
      <div style="flex:1">
        <div class="field-inputs">
          <input type="text" class="field-label" value="${f.label}" placeholder="Pertanyaan..." />
          <select class="field-type">
            <option value="text" ${f.type === 'text' ? 'selected' : ''}>Teks</option>
            <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Paragraf</option>
            <option value="select" ${f.type === 'select' ? 'selected' : ''}>Pilihan</option>
          </select>
        </div>
        <div class="field-options" style="display:${f.type === 'select' ? 'block' : 'none'}">
          <textarea class="field-options-text" rows="2" placeholder="Opsi (pisahkan dengan koma)">${(f.options || []).join(', ')}</textarea>
        </div>
      </div>
      <button type="button" class="btn-remove-field" data-index="${i}">&times;</button>
    </div>
  `).join('')

  container.querySelectorAll('.field-type').forEach(sel => {
    sel.addEventListener('change', () => {
      const item = sel.closest('.form-field-item')
      const optionsDiv = item.querySelector('.field-options')
      optionsDiv.style.display = sel.value === 'select' ? 'block' : 'none'
    })
  })

  container.querySelectorAll('.btn-remove-field').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.form-field-item')
      item.remove()
    })
  })
}

function collectFormFields() {
  const items = document.querySelectorAll('#formFieldsContainer .form-field-item')
  return Array.from(items).map(item => {
    const label = item.querySelector('.field-label').value.trim()
    const type = item.querySelector('.field-type').value
    const options = item.querySelector('.field-options-text')
    return {
      id: 'field_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      label: label || 'Pertanyaan',
      type,
      required: true,
      options: type === 'select' && options ? options.value.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
  })
}

document.getElementById('btnAddFormField').addEventListener('click', () => {
  const container = document.getElementById('formFieldsContainer')
  const emptyMsg = container.querySelector('p')
  if (emptyMsg) container.innerHTML = ''
  const fields = collectFormFields()
  fields.push({ id: 'field_new', label: '', type: 'text', required: true, options: [] })
  renderFormFields(fields)
})

// ============ SERVICE MODAL ============
const serviceModal = document.getElementById('serviceModal')
const serviceModalTitle = document.getElementById('serviceModalTitle')
const serviceForm = document.getElementById('serviceForm')
const btnSubmitService = document.getElementById('btnSubmitService')

let editingServiceId = null

document.getElementById('btnAddService').addEventListener('click', () => openAddServiceModal())
document.getElementById('serviceModalClose').addEventListener('click', () => closeServiceModal())
serviceModal.addEventListener('click', e => {
  if (e.target === serviceModal) closeServiceModal()
})

function openAddServiceModal() {
  editingServiceId = null
  serviceModalTitle.textContent = 'Tambah Jasa Baru'
  serviceForm.reset()
  document.getElementById('serviceId').value = ''
  document.getElementById('formFieldsContainer').innerHTML = '<p style="font-size:0.875rem;opacity:0.6">Belum ada pertanyaan. Klik tombol di bawah untuk menambah.</p>'
  btnSubmitService.textContent = 'Simpan Jasa'
  renderServiceTagCheckboxes(allTags)
  document.querySelectorAll('.service-tag-cb').forEach(cb => cb.checked = false)
  serviceModal.classList.add('open')
}

function openEditServiceModal(id) {
  editingServiceId = id
  serviceModalTitle.textContent = 'Edit Jasa'
  const service = allServices.find(s => s.id === id)
  if (!service) return

  document.getElementById('serviceId').value = service.id
  document.getElementById('serviceFormTitle').value = service.title || ''
  document.getElementById('serviceFormPriceMin').value = service.priceMin || ''
  document.getElementById('serviceFormPriceMax').value = service.priceMax || ''
  document.getElementById('serviceFormPreviewImage').value = service.previewImage || ''
  document.getElementById('serviceFormLynkUrl').value = service.lynkUrl || ''
  document.getElementById('serviceFormDescription').value = service.description || ''
  renderFormFields(service.formFields || [])
  renderServiceTagCheckboxes(allTags)
  const serviceTags = service.tags || []
  document.querySelectorAll('.service-tag-cb').forEach(cb => {
    cb.checked = serviceTags.includes(cb.value)
  })
  btnSubmitService.textContent = 'Update Jasa'
  serviceModal.classList.add('open')
}

function closeServiceModal() {
  serviceModal.classList.remove('open')
  editingServiceId = null
}

serviceForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const id = editingServiceId || generateServiceId(document.getElementById('serviceFormTitle').value)

  const service = {
    id,
    title: document.getElementById('serviceFormTitle').value.trim(),
    priceMin: document.getElementById('serviceFormPriceMin').value.trim(),
    priceMax: document.getElementById('serviceFormPriceMax').value.trim(),
    previewImage: document.getElementById('serviceFormPreviewImage').value.trim() || '/placeholder.svg',
    lynkUrl: document.getElementById('serviceFormLynkUrl').value.trim(),
    description: document.getElementById('serviceFormDescription').value.trim(),
    tags: collectSelectedTags(),
    formFields: collectFormFields(),
    createdAt: editingServiceId ? undefined : new Date().toISOString(),
  }

  if (!editingServiceId) service.createdAt = new Date().toISOString()

  btnSubmitService.disabled = true
  btnSubmitService.textContent = 'Menyimpan...'

  try {
    const res = await fetch('/api/save-service', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ service }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Gagal menyimpan: ' + (err.error || 'Unknown error'))
      return
    }

    closeServiceModal()
    await loadServices()
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message)
  } finally {
    btnSubmitService.disabled = false
    btnSubmitService.textContent = editingServiceId ? 'Update Jasa' : 'Simpan Jasa'
  }
})

function generateServiceId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'jasa-' + Date.now()
}

async function deleteService(id) {
  if (!confirm(`Hapus jasa "${allServices.find(s => s.id === id)?.title}"?`)) return

  try {
    const res = await fetch('/api/delete-service', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ serviceId: id }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Gagal menghapus: ' + (err.error || 'Unknown error'))
      return
    }

    await loadServices()
  } catch (err) {
    alert('Gagal menghapus: ' + err.message)
  }
}

// ============ ORDERS ============
let allOrders = []

async function loadOrders() {
  const tbody = document.getElementById('orderTableBody')
  tbody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>'

  try {
    const res = await fetch('/api/get-orders', { headers: apiHeaders() })
    allOrders = res.ok ? await res.json() : []
    renderOrderTable(document.getElementById('searchOrder').value)
  } catch {
    allOrders = []
    tbody.innerHTML = '<tr><td colspan="5">Gagal memuat data.</td></tr>'
  }
}

function renderOrderTable(filter = '') {
  const tbody = document.getElementById('orderTableBody')
  let filtered = filter
    ? allOrders.filter(o =>
        o.customerName.toLowerCase().includes(filter.toLowerCase()) ||
        o.customerWa.includes(filter) ||
        (o.serviceTitle || '').toLowerCase().includes(filter.toLowerCase())
      )
    : allOrders

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Belum ada pesanan.</td></tr>'
    return
  }

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td style="white-space:nowrap">${formatDate(o.createdAt)}</td>
      <td><strong>${o.customerName}</strong></td>
      <td><a href="https://wa.me/${o.customerWa.replace(/^0+/, '62').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" style="color:var(--teal);text-decoration:none">${o.customerWa}</a></td>
      <td>${o.serviceTitle || '-'}</td>
      <td><button class="btn-edit" data-id="${o.id}">Detail</button></td>
    </tr>
  `).join('')

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openOrderDetail(btn.dataset.id))
  })
}

document.getElementById('searchOrder').addEventListener('input', e => {
  renderOrderTable(e.target.value)
})

document.getElementById('btnRefreshOrders').addEventListener('click', loadOrders)

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ============ ORDER DETAIL MODAL ============
const orderModal = document.getElementById('orderModal')
const orderModalTitle = document.getElementById('orderModalTitle')
const orderDetailBody = document.getElementById('orderDetailBody')

document.getElementById('orderModalClose').addEventListener('click', () => orderModal.classList.remove('open'))
orderModal.addEventListener('click', e => {
  if (e.target === orderModal) orderModal.classList.remove('open')
})

function openOrderDetail(orderId) {
  const order = allOrders.find(o => o.id === orderId)
  if (!order) return

  orderModalTitle.textContent = 'Detail Pesanan'
  orderDetailBody.innerHTML = `
    <div class="order-detail-info">
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${order.customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">WhatsApp</span>
        <span class="info-value"><a href="https://wa.me/${order.customerWa.replace(/^0+/, '62').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener">${order.customerWa}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Jasa</span>
        <span class="info-value">${order.serviceTitle || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Waktu</span>
        <span class="info-value">${formatDate(order.createdAt)}</span>
      </div>
    </div>
    <div class="order-detail-answers">
      <h3>Jawaban Form</h3>
      ${order.answers && Object.keys(order.answers).length > 0
        ? order.serviceFields
          ? order.serviceFields.map(f => `
            <div class="answer-row">
              <div class="answer-question">${f.label}</div>
              <div class="answer-value">${order.answers[f.id] || '-'}</div>
            </div>
          `).join('')
          : Object.entries(order.answers).map(([q, a]) => `
            <div class="answer-row">
              <div class="answer-question">${q}</div>
              <div class="answer-value">${a}</div>
            </div>
          `).join('')
        : '<p style="font-size:0.875rem;opacity:0.6">Tidak ada jawaban form.</p>'
      }
    </div>
  `

  orderModal.classList.add('open')
}

// ============ REFRESH ============
async function refreshData() {
  await loadData()
  renderOverview()
  renderProductTable(document.getElementById('searchProduct').value)
  loadLandingEditor()
  await loadServices()
}

// ============ INIT ============
async function init() {
  await loadData()
  renderOverview()
  renderProductTable()
  loadLandingEditor()
  loadTags()

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
