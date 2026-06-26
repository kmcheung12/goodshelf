I like hoarding books. I like their look on the shelf. I might not read it now, but I enjoy having them.
My shelf is my fridge. It should never run out of food, food for the mind. 

I always imagine having a virtual shelf, a "shelf" beyond a list of names.
Came across [Stealing Is a Skill](https://news.ycombinator.com/item?id=48659165) and [Criterion Closet](https://news.ycombinator.com/item?id=48609054) the other day.
So today is the day.


I also imagine a virtual book store, where people can roam around and flip the books. Would be so nice if bookdespository (sadly gone) have this interaction and have the book delivered to my home.
Maybe later.



### Data source
Goodreads rss

- https://www.goodreads.com/review/list_rss/{USERID}?per-page=200&&shelf=currently-reading
- https://www.goodreads.com/review/list_rss/{USERID}?per-page=200&&shelf=to-read
- https://www.goodreads.com/review/list_rss/{USERID}?per-page=200&&shelf=read

Goodreads rss limits 200 books per shelf

---

## Development

### Start the proxy server

```bash
# cwd: shelf/server
node index.js
```

Runs on `http://localhost:3001`. Proxies Goodreads RSS and cover image requests to avoid CORS.

### Start the frontend

```bash
# cwd: shelf
npm run dev
```

Runs on `http://localhost:5173`. Opens the app in the browser. Expects the proxy server to be running at `localhost:3001` (or set `VITE_PROXY_URL`).

### Build browser extensions

```bash
# cwd: shelf

# Chrome
npm run build:extension   # → dist-chrome/

# Firefox
npm run build:extension-firefox     # → dist-firefox/
```

Load unpacked in Chrome via `chrome://extensions` → **Load unpacked** → select `dist-chrome/`.  
Load in Firefox via `about:debugging` → **Load Temporary Add-on** → select any file inside `dist-firefox/`.
