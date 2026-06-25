const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

app.get('/rss', async (req, res) => {
  const { userId, shelf } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).send('userId query param required');
  }

  const shelfQ = shelf && typeof shelf === 'string' ? `?shelf=${encodeURIComponent(shelf)}` : '';
  const url = `https://www.goodreads.com/review/list_rss/${encodeURIComponent(userId)}${shelfQ}`;
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

app.listen(PORT, () => console.log(`Shelf proxy listening on http://localhost:${PORT}`));
