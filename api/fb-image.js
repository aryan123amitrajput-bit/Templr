const ALLOWED_HOST_PATTERNS = [
  /(^|\.)fbcdn\.net$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)fbsbx\.com$/i,
  /(^|\.)cdninstagram\.com$/i,
  /^scontent\./i,
];

function isAllowedFacebookHost(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!rawUrl) return res.status(400).json({ error: 'Missing url query parameter' });

  const decodedUrl = decodeURIComponent(rawUrl);
  if (!isAllowedFacebookHost(decodedUrl)) {
    return res.status(403).json({ error: 'Only HTTPS Facebook CDN URLs are allowed' });
  }

  try {
    const upstream = await fetch(decodedUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.facebook.com/',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Facebook CDN returned ${upstream.status}`,
      });
    }

    // Node 18+ native fetch on Vercel supports arrayBuffer (buffer() is undefined).
    const bytes = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');

    return res.status(200).send(bytes);
  } catch (error) {
    console.error('fb-image proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy Facebook image' });
  }
}
