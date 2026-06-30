// Serverless function — Save Product (Tambah/Edit)
// Deploy ke Vercel/Netlify sebagai API endpoint
// Environment: GITHUB_TOKEN, GITHUB_REPO, ADMIN_PASSWORD

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { product } = req.body;

  if (!product || !product.id || !product.title || !product.lynkUrl) {
    return res.status(400).json({ error: 'Missing required fields: id, title, lynkUrl' });
  }

  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const [owner, repo] = (process.env.GITHUB_REPO || '').split('/');

    await octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: `data/products/${product.id}.json`,
      message: `save-product: ${product.id}`,
      content: Buffer.from(JSON.stringify(product, null, 2)).toString('base64'),
    });

    return res.status(200).json({ ok: true, id: product.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
