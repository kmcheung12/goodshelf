const PER_PAGE = 200;

// Open the shelf in a new tab when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Mirror the server's /rss endpoint so extension pages avoid CORS
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'rss') return false;

  const { userId, shelf, perPage = PER_PAGE, page = 1 } = msg as {
    userId: string;
    shelf?: string;
    perPage?: number;
    page?: number;
  };

  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  if (shelf) params.set('shelf', shelf);

  fetch(
    `https://www.goodreads.com/review/list_rss/${encodeURIComponent(userId)}?${params}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 shelf-extension/1.0' } },
  )
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then((xml) => sendResponse({ ok: true, xml }))
    .catch((e) => sendResponse({ ok: false, error: String(e) }));

  return true; // keep the message channel open for the async response
});
