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
