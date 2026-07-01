import { Octokit } from '@octokit/rest'

export function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token || token === 'your_github_personal_access_token') {
    throw new Error('GITHUB_TOKEN belum diatur di environment Netlify')
  }
  return new Octokit({ auth: token })
}

export function getRepo() {
  const repo = process.env.GITHUB_REPO
  if (!repo || repo === 'owner/repo-name') {
    throw new Error('GITHUB_REPO belum diatur di environment Netlify (format: owner/repo)')
  }
  const [owner, name] = repo.split('/')
  return { owner, repo: name }
}

export async function getFileSha(path) {
  const octokit = getOctokit()
  const { owner, repo } = getRepo()
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path })
    return data.sha
  } catch {
    return undefined
  }
}
