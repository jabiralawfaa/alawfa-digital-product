// Serverless function — Track View
// Deploy ke Vercel/Netlify sebagai API endpoint
// Environment: GITHUB_TOKEN, GITHUB_REPO

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'productId required' });
  }

  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const [owner, repo] = (process.env.GITHUB_REPO || '').split('/');

    const { data: file } = await octokit.repos.getContent({
      owner, repo, path: 'data/stats.json',
    });

    const content = JSON.parse(
      Buffer.from(file.content, 'base64').toString('utf-8')
    );

    if (!content[productId]) {
      content[productId] = { views: 0, clicks: 0 };
    }
    content[productId].views += 1;

    await octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: 'data/stats.json',
      message: `track-view: ${productId}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha: file.sha,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
