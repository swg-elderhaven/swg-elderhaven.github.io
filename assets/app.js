/* SWG Elder Haven website: public connection details. */
const ELDER_HAVEN = {
  DISCORD_URL: "https://discord.gg/QUsTCQkw7",
  SERVER_IP: "207.244.229.181:44453"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

$$('.panel-title[type="button"]').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.closest('.panel');
    const collapsed = panel.classList.toggle('collapsed');
    button.setAttribute('aria-expanded', String(!collapsed));
    const glyph = $('.panel-glyph', button);
    if (glyph) glyph.textContent = collapsed ? '+' : '−';
  });
});

$$('[data-link="discord"]').forEach(a => a.href = ELDER_HAVEN.DISCORD_URL);

$$('[data-server-ip]').forEach(node => {
  node.textContent = ELDER_HAVEN.SERVER_IP || 'COMING SOON';
});

const ipBox = $('#server-ip');
if (ipBox) {
  ipBox.textContent = ELDER_HAVEN.SERVER_IP || 'COMING SOON';
}

$('#poll-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const result = $('#poll-result');
  result.value = `Vote recorded locally: ${data.get('goal')}.`;
  setTimeout(() => { result.value = 'Thanks for voting.'; }, 900);
});

/* Shared public game availability. It does not control account or launcher readiness. */
(() => {
  const endpoint = 'https://elder-haven-status.swg-elderhaven.workers.dev/status/v1';
  const indicators = [];
  document.querySelectorAll('.status-strip').forEach(strip => {
    const block = [...strip.querySelectorAll('.status-block')].find(node => /^STATUS:$/i.test(node.querySelector('strong')?.textContent.trim() || ''));
    if (!block) return;
    const led = document.createElement('span'); led.className = 'led pending'; led.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('strong'); heading.textContent = 'SERVER:';
    const text = document.createElement('span'); text.textContent = 'CHECKING…'; text.style.marginLeft = '4px';
    text.setAttribute('aria-live', 'polite'); text.setAttribute('aria-atomic', 'true');
    block.replaceChildren(led, heading, text);
    const phase = document.createElement('div'); phase.className = 'status-block';
    const phaseTitle = document.createElement('strong'); phaseTitle.textContent = 'PHASE:';
    phase.append(phaseTitle, document.createTextNode(' ALPHA')); strip.append(phase);
    indicators.push({ led, text, block });
  });
  if (!indicators.length) return;
  function show(status, checkedAt) {
    const labels = { online: 'ONLINE', offline: 'OFFLINE', unknown: 'UNAVAILABLE' };
    indicators.forEach(({ led, text, block }) => {
      led.className = 'led ' + (status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'pending');
      text.textContent = labels[status] || labels.unknown;
      block.title = checkedAt ? 'Server status checked ' + new Date(checkedAt).toLocaleTimeString() : 'Server status could not be checked. Please try again shortly.';
    });
  }
  function valid(value) {
    if (!value || Object.keys(value).length !== 6 || value.schema !== 'elder-haven-server-status-v1' || value.server !== 'elder-haven' || value.source !== 'core3-native' || value.valid_for_seconds !== 45 || !['online', 'offline', 'unknown'].includes(value.status)) return false;
    const age = Date.now() - Date.parse(value.checked_at);
    return Number.isFinite(age) && age >= -30000 && age <= 45000;
  }
  async function read(response) {
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json') || !response.body) throw new Error('Unavailable');
    const reader = response.body.getReader(); const chunks = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        length += value.byteLength; if (length > 1024) throw new Error('Unavailable'); chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.byteLength; });
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!valid(value)) throw new Error('Unavailable'); return value;
  }
  let pending = false; let controller;
  async function refresh() {
    if (document.hidden || pending) return;
    pending = true; controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(endpoint, { mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal });
      const value = await read(response); show(value.status, value.checked_at);
    } catch { show('unknown'); }
    finally { clearTimeout(timeout); pending = false; controller = undefined; }
  }
  void refresh();
  setInterval(() => void refresh(), 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { show('unknown'); void refresh(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) { show('unknown'); void refresh(); } });
  window.addEventListener('pagehide', () => controller?.abort());
})();
