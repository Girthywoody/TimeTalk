import { parse } from 'node-html-metadata-parser';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const result = await fetch(url);
    const html = await result.text();
    const metadata = await parse(html);
    
    res.json({
      title: metadata.meta.title || '',
      description: metadata.meta.description || '',
      image: metadata.meta.image || '',
      url: metadata.meta.url || url
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch link preview' });
  }
}