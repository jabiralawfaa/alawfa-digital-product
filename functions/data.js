import { getOctokit, getRepo } from './github.js'

export const handler = async (event) => {
  try {
    const octokit = getOctokit()
    const { owner, repo } = getRepo()

    const { data } = await octokit.repos.getContent({
      owner, repo, path: 'data/products',
    })

    const files = data
      .filter(item => item.type === 'file' && item.name.endsWith('.json'))
      .map(item => item.name)

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
