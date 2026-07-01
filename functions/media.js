import { getOctokit, getRepo } from './github.js'

export const handler = async (event) => {
  try {
    const octokit = getOctokit()
    const { owner, repo } = getRepo()

    const { data } = await octokit.repos.getContent({
      owner, repo, path: 'media',
    })

    const files = data
      .filter(item => item.type === 'file')
      .filter(item => /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(item.name))
      .map(item => ({
        name: item.name,
        url: `/media/${item.name}`,
        size: item.size,
        mtime: new Date(item.last_modified || item.sha).getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime)

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
