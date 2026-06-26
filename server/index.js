const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// ── In-memory cache ───────────────────────────────────────────────────────────
const RSS_TTL   = 24 * 60 * 60 * 1000;  // 24 hours
const COVER_TTL = 24 * 60 * 60 * 1000;  // 24 hours

const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data, ttl) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
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

  const key = `rss:${userId}:${qs}`;
  const cached = getCached(key);
  if (cached) {
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached);
  }

  const url = `https://www.goodreads.com/review/list_rss/${encodeURIComponent(userId)}${qs}`;
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 shelf-proxy/1.0' },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).send(`Goodreads returned ${upstream.status}`);
    }
    const xml = await upstream.text();
    setCached(key, xml, RSS_TTL);
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('X-Cache', 'MISS');
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

  const key = `cover:${url}`;
  const cached = getCached(key);
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.buffer);
  }

  try {
    const upstream = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 shelf-proxy/1.0' },
    });
    if (!upstream.ok) return res.status(upstream.status).send(`Image error: ${upstream.status}`);
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());
    setCached(key, { buffer, contentType }, COVER_TTL);
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Cache', 'MISS');
    res.send(buffer);
  } catch (err) {
    res.status(502).send(`Fetch failed: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Shelf proxy listening on http://localhost:${PORT}`));
