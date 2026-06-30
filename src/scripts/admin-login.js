import { setTheme, getPreferredTheme } from './theme.js'

const form = document.getElementById('loginForm')
const errorEl = document.getElementById('loginError')
const passwordInput = document.getElementById('password')

setTheme(getPreferredTheme())

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  const password = passwordInput.value.trim()

  if (!password) {
    errorEl.textContent = 'Password harus diisi'
    return
  }

  const btn = form.querySelector('.btn-login')
  btn.disabled = true
  btn.textContent = 'Memeriksa...'

  try {
    const res = await fetch('/api/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()

    if (res.ok && data.ok) {
      sessionStorage.setItem('admin_auth', password)
      window.location.href = '/admin/'
    } else {
      errorEl.textContent = 'Password salah'
      btn.disabled = false
      btn.textContent = 'Masuk'
    }
  } catch {
    errorEl.textContent = 'Gagal terhubung ke server'
    btn.disabled = false
    btn.textContent = 'Masuk'
  }
})
