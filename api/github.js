import { Octokit } from '@octokit/rest'

function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token || token === 'your_github_personal_access_token') {
    throw new Error('GITHUB_TOKEN belum diatur di .env')
  }
  return new Octokit({ auth: token })
}

function getRepo() {
  const repo = process.env.GITHUB_REPO
  if (!repo || repo === 'owner/repo-name') {
    throw new Error('GITHUB_REPO belum diatur di .env (format: owner/repo)')
  }
  const [owner, name] = repo.split('/')
  return { owner, repo: name }
}

export async function trackView(productId) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()

  const { data: file } = await octokit.repos.getContent({
    owner, repo, path: 'data/stats.json',
  })

  const content = JSON.parse(
    Buffer.from(file.content, 'base64').toString('utf-8')
  )

  if (!content[productId]) {
    content[productId] = { views: 0, clicks: 0 }
  }
  content[productId].views += 1

  await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: 'data/stats.json',
    message: `track-view: ${productId}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    sha: file.sha,
  })
}

export async function trackClick(productId) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()

  const { data: file } = await octokit.repos.getContent({
    owner, repo, path: 'data/stats.json',
  })

  const content = JSON.parse(
    Buffer.from(file.content, 'base64').toString('utf-8')
  )

  if (!content[productId]) {
    content[productId] = { views: 0, clicks: 0 }
  }
  content[productId].clicks += 1

  await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: 'data/stats.json',
    message: `track-click: ${productId}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    sha: file.sha,
  })
}

async function getFileSha(path) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path })
    return data.sha
  } catch {
    return undefined
  }
}

export async function saveProduct(productData) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/products/${productData.id}.json`
  const sha = await getFileSha(path)

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `save-product: ${productData.id}`,
    content: Buffer.from(JSON.stringify(productData, null, 2)).toString('base64'),
    sha,
  })
}

export async function deleteProduct(productId) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/products/${productId}.json`
  const sha = await getFileSha(path)
  if (!sha) return

  await octokit.repos.deleteFile({
    owner, repo, path,
    message: `delete-product: ${productId}`,
    sha,
  })
}

export async function uploadFile(fileName, base64Content) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `media/${fileName}`
  const sha = await getFileSha(path)

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `upload: ${fileName}`,
    content: base64Content,
    sha,
  })
}

export async function saveLanding(data) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = 'data/landing.json'
  const sha = await getFileSha(path)

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: 'update-landing',
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
    sha,
  })
}

export async function saveService(serviceData) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/services/${serviceData.id}.json`
  const sha = await getFileSha(path)
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `save-service: ${serviceData.id}`,
    content: Buffer.from(JSON.stringify(serviceData, null, 2)).toString('base64'),
    sha,
  })
}

export async function deleteService(serviceId) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/services/${serviceId}.json`
  const sha = await getFileSha(path)
  if (!sha) return
  await octokit.repos.deleteFile({
    owner, repo, path,
    message: `delete-service: ${serviceId}`,
    sha,
  })
}

export async function saveTag(tagData) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/tags/${tagData.id}.json`
  const sha = await getFileSha(path)
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `save-tag: ${tagData.id}`,
    content: Buffer.from(JSON.stringify(tagData, null, 2)).toString('base64'),
    sha,
  })
}

export async function deleteTag(tagId) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/tags/${tagId}.json`
  const sha = await getFileSha(path)
  if (!sha) return
  await octokit.repos.deleteFile({
    owner, repo, path,
    message: `delete-tag: ${tagId}`,
    sha,
  })
}

export async function saveOrder(orderData) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  const path = `data/orders/${orderData.id}.json`
  const sha = await getFileSha(path)
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `order: ${orderData.id}`,
    content: Buffer.from(JSON.stringify(orderData, null, 2)).toString('base64'),
    sha,
  })
}
