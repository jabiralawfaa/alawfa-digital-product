import { getOctokit, getRepo } from './github.js'

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const handler = async (event) => {
  const productId = event.queryStringParameters?.id || ''
  if (!productId) {
    return { statusCode: 404, headers: { 'Content-Type': 'text/html' }, body: 'Not found' }
  }

  const host = event.headers['x-forwarded-host'] || event.headers.host || 'site'
  const proto = event.headers['x-forwarded-proto'] || 'https'
  const siteUrl = `${proto}://${host}`
  const detailUrl = `${siteUrl}/detail.html?id=${productId}`

  let title = 'Al-Awfa Digital Product'
  let description = 'Lihat produk digital terbaru'
  let image = ''
  let category = ''

  try {
    const octokit = getOctokit()
    const { owner, repo } = getRepo()
    const { data: file } = await octokit.repos.getContent({
      owner, repo, path: `data/products/${productId}.json`
    })
    const product = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
    title = product.title || title
    category = product.category || ''
    const stripHtml = (product.description || '').replace(/<[^>]*>/g, '').trim()
    description = stripHtml.slice(0, 200) || description
    if (product.previewImage) {
      image = product.previewImage.startsWith('http') ? product.previewImage : `${siteUrl}${product.previewImage}`
    }
  } catch {
    // use defaults
  }

  const fullTitle = escapeHtml(title)
  const fullDesc = escapeHtml(description)
  const fullImage = escapeHtml(image)
  const fullUrl = escapeHtml(detailUrl)

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fullTitle} — Al-Awfa Digital Product</title>
<meta property="og:title" content="${fullTitle}${category ? ` — ${escapeHtml(category)}` : ''}">
<meta property="og:description" content="${fullDesc}">
${fullImage ? `<meta property="og:image" content="${fullImage}">` : ''}
<meta property="og:url" content="${fullUrl}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${fullUrl}">
</head>
<body>
<script>location.href="${fullUrl}"</script>
</body>
</html>`

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html,
  }
}
