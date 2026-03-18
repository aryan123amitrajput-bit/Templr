const DATA_URL_REGEX = /^data:(.+);base64,(.+)$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FB_PAGE_ID;

  if (!accessToken || !pageId) {
    return res.status(500).json({
      error: 'Missing FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID environment variable',
    });
  }

  try {
    const { imageBase64, fileName, mimeType } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const matches = imageBase64.match(DATA_URL_REGEX);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid imageBase64 format. Expected Data URL.' });
    }

    const inferredType = mimeType || matches[1] || 'image/jpeg';
    const imageBuffer = Buffer.from(matches[2], 'base64');

    if (imageBuffer.length === 0) return res.status(400).json({ error: 'Decoded image is empty' });
    if (imageBuffer.length > 12 * 1024 * 1024) return res.status(400).json({ error: 'Image exceeds 12MB limit' });

    const fbForm = new FormData();
    const blob = new Blob([imageBuffer], { type: inferredType });
    fbForm.append('source', blob, fileName || 'upload.jpg');
    fbForm.append('access_token', accessToken);
    fbForm.append('published', 'false');

    const uploadResp = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: 'POST',
      body: fbForm,
    });

    const uploadJson = await uploadResp.json();
    if (!uploadResp.ok || uploadJson.error || !uploadJson.id) {
      return res.status(502).json({
        error: uploadJson?.error?.message || 'Facebook upload failed',
        details: uploadJson,
      });
    }

    const photoId = uploadJson.id;

    const infoResp = await fetch(
      `https://graph.facebook.com/v19.0/${photoId}?fields=images&access_token=${encodeURIComponent(accessToken)}`
    );
    const infoJson = await infoResp.json();

    if (!infoResp.ok || infoJson.error || !Array.isArray(infoJson.images) || infoJson.images.length === 0) {
      return res.status(502).json({
        error: infoJson?.error?.message || 'Facebook did not return image variants',
        details: infoJson,
      });
    }

    const cdnUrl = infoJson.images[0].source;
    const proxiedUrl = `/api/fb-image?url=${encodeURIComponent(cdnUrl)}`;

    return res.status(200).json({
      success: true,
      photoId,
      cdnUrl,
      proxiedUrl,
      url: proxiedUrl,
    });
  } catch (error) {
    console.error('fb-upload error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to upload image to Facebook' });
  }
}
