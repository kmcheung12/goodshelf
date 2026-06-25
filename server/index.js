const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

app.get('/rss', async (req, res) => {
  const { userId, shelf, per_page, page } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).send('userId query param required');
  }

  const params = new URLSearchParams();
  if (shelf && typeof shelf === 'string') params.set('shelf', shelf);
  if (per_page && typeof per_page === 'string') params.set('per_page', per_page);
  if (page && typeof page === 'string') params.set('page', page);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const url = `https://www.goodreads.com/review/list_rss/${encodeURIComponent(userId)}${qs}`;
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 shelf-proxy/1.0' },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).send(`Goodreads returned ${upstream.status}`);
    }
    const xml = await upstream.text();
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.status(502).send(`Fetch failed: ${err.message}`);
  }
});

app.get('/cover', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('url query param required');
  }
  try {
    const upstream = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 shelf-proxy/1.0' },
    });
    if (!upstream.ok) return res.status(upstream.status).send(`Image error: ${upstream.status}`);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    res.status(502).send(`Fetch failed: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Shelf proxy listening on http://localhost:${PORT}`));
