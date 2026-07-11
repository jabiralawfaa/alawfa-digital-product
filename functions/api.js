import { getOctokit, getRepo, getFileSha } from './github.js'

function json(status, data) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}

function unauthorized() {
  return json(401, { error: 'Unauthorized' })
}

function checkAuth(event) {
  const auth = event.headers.authorization || event.headers.Authorization
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return false
  }
  return true
}

export const handler = async (event) => {
  const path = event.path.replace(/^\/api\//, '')
  const method = event.httpMethod

  try {
    if (path === 'track-view') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      const { productId } = JSON.parse(event.body || '{}')
      if (!productId) return json(400, { error: 'productId required' })

      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const { data: file } = await octokit.repos.getContent({ owner, repo, path: 'data/stats.json' })
      const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
      if (!content[productId]) content[productId] = { views: 0, clicks: 0 }
      content[productId].views += 1
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: 'data/stats.json',
        message: `track-view: ${productId}`,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
        sha: file.sha,
      })
      return json(200, { ok: true })
    }

    if (path === 'track-click') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      const { productId } = JSON.parse(event.body || '{}')
      if (!productId) return json(400, { error: 'productId required' })

      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const { data: file } = await octokit.repos.getContent({ owner, repo, path: 'data/stats.json' })
      const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
      if (!content[productId]) content[productId] = { views: 0, clicks: 0 }
      content[productId].clicks += 1
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: 'data/stats.json',
        message: `track-click: ${productId}`,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
        sha: file.sha,
      })
      return json(200, { ok: true })
    }

    if (path === 'verify-login') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      const { password } = JSON.parse(event.body || '{}')
      if (!password || password !== process.env.ADMIN_PASSWORD) {
        return json(401, { error: 'Unauthorized' })
      }
      return json(200, { ok: true })
    }

    if (path === 'save-product') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { product } = JSON.parse(event.body || '{}')
      if (!product || !product.id || !product.title || !product.lynkUrl) {
        return json(400, { error: 'Missing required fields: id, title, lynkUrl' })
      }

      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/products/${product.id}.json`)
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: `data/products/${product.id}.json`,
        message: `save-product: ${product.id}`,
        content: Buffer.from(JSON.stringify(product, null, 2)).toString('base64'),
        sha,
      })
      return json(200, { ok: true, id: product.id })
    }

    if (path === 'delete-product') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { productId } = JSON.parse(event.body || '{}')
      if (!productId) return json(400, { error: 'productId required' })

      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/products/${productId}.json`)
      if (sha) {
        await octokit.repos.deleteFile({
          owner, repo, path: `data/products/${productId}.json`,
          message: `delete-product: ${productId}`, sha,
        })
      }
      return json(200, { ok: true })
    }

    if (path === 'save-landing') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { landing } = JSON.parse(event.body || '{}')
      if (!landing) return json(400, { error: 'landing data required' })

      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha('data/landing.json')
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: 'data/landing.json',
        message: 'update-landing',
        content: Buffer.from(JSON.stringify(landing, null, 2)).toString('base64'),
        sha,
      })
      return json(200, { ok: true })
    }

    if (path === 'upload') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { file, name } = JSON.parse(event.body || '{}')
      if (!file || !name) return json(400, { error: 'file (base64) dan name required' })

      const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`media/${safeName}`)
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: `media/${safeName}`,
        message: `upload: ${safeName}`,
        content: file,
        sha,
      })
      return json(200, { url: `/media/${safeName}` })
    }

    if (path === 'save-service') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { service } = JSON.parse(event.body || '{}')
      if (!service || !service.id || !service.title) {
        return json(400, { error: 'Missing required fields: id, title' })
      }
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/services/${service.id}.json`)
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: `data/services/${service.id}.json`,
        message: `save-service: ${service.id}`,
        content: Buffer.from(JSON.stringify(service, null, 2)).toString('base64'),
        sha,
      })
      return json(200, { ok: true, id: service.id })
    }

    if (path === 'delete-service') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { serviceId } = JSON.parse(event.body || '{}')
      if (!serviceId) return json(400, { error: 'serviceId required' })
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/services/${serviceId}.json`)
      if (sha) {
        await octokit.repos.deleteFile({
          owner, repo, path: `data/services/${serviceId}.json`,
          message: `delete-service: ${serviceId}`, sha,
        })
      }
      return json(200, { ok: true })
    }

    if (path === 'save-tag') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { tag } = JSON.parse(event.body || '{}')
      if (!tag || !tag.id || !tag.name) {
        return json(400, { error: 'Missing required fields: id, name' })
      }
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/tags/${tag.id}.json`)
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: `data/tags/${tag.id}.json`,
        message: `save-tag: ${tag.id}`,
        content: Buffer.from(JSON.stringify(tag, null, 2)).toString('base64'),
        sha,
      })
      return json(200, { ok: true, id: tag.id })
    }

    if (path === 'delete-tag') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const { tagId } = JSON.parse(event.body || '{}')
      if (!tagId) return json(400, { error: 'tagId required' })
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/tags/${tagId}.json`)
      if (sha) {
        await octokit.repos.deleteFile({
          owner, repo, path: `data/tags/${tagId}.json`,
          message: `delete-tag: ${tagId}`, sha,
        })
      }
      return json(200, { ok: true })
    }

    if (path === 'submit-order') {
      if (method !== 'POST') return json(405, { error: 'Method not allowed' })
      const { order } = JSON.parse(event.body || '{}')
      if (!order || !order.serviceId || !order.customerName || !order.customerWa) {
        return json(400, { error: 'Missing required fields: serviceId, customerName, customerWa' })
      }
      order.createdAt = new Date().toISOString()
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const sha = await getFileSha(`data/orders/${order.id}.json`)
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: `data/orders/${order.id}.json`,
        message: `order: ${order.id}`,
        content: Buffer.from(JSON.stringify(order, null, 2)).toString('base64'),
        sha,
      })
      return json(200, { ok: true, id: order.id })
    }

    if (path === 'get-orders') {
      if (method !== 'GET') return json(405, { error: 'Method not allowed' })
      if (!checkAuth(event)) return unauthorized()
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      try {
        const { data: items } = await octokit.repos.getContent({ owner, repo, path: 'data/orders' })
        const orders = []
        for (const item of items) {
          if (item.type === 'file' && item.name.endsWith('.json')) {
            const { data: file } = await octokit.repos.getContent({ owner, repo, path: item.path })
            const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'))
            orders.push(content)
          }
        }
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return json(200, orders)
      } catch {
        return json(200, [])
      }
    }

    return json(404, { error: 'Not found' })
  } catch (err) {
    return json(500, { error: err.message })
  }
}
