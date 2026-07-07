import { getOctokit, getRepo } from './github.js'

export const handler = async (event) => {
  try {
    const octokit = getOctokit()
    const { owner, repo } = getRepo()

    // Determine sub-path from request: /data -> products, /data/services -> services
    const sub = event.path.replace(/^\/data\/?/, '').replace(/\/$/, '') || 'products'
    const ghPath = sub.startsWith('products') || sub.startsWith('services') ? `data/${sub}` : 'data/products'

    let files
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: ghPath })
      files = data
        .filter(item => item.type === 'file' && item.name.endsWith('.json'))
        .map(item => item.name)
    } catch {
      files = []
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(files),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
