const { parse } = require('querystring');
const { validateUrl } = require('./utils');
const { withState, addEvent, getAppState, createLink } = require('./state');
const { renderDashboard } = require('./render');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendRedirect(res, location) {
  res.writeHead(303, { Location: location });
  res.end();
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  const body = Buffer.from(text, 'utf8');
  res.writeHead(statusCode, { 'Content-Type': contentType, 'Content-Length': body.length });
  res.end(body);
}

async function handleAddLink(req, res) {
  const form = parse(await readBody(req));
  const url = String(form.url || '').trim();
  const name = String(form.name || '').trim() || url;
  const enabled = form.enabled !== undefined;

  if (!validateUrl(url)) { sendText(res, 400, 'URL invalida'); return; }

  await withState(async (state) => {
    state.links.push(createLink(name, url, enabled));
    addEvent(state, 'info', `Link adicionado: ${name}.`);
  });

  sendRedirect(res, '/');
}

async function handleSettings(req, res) {
  const form = parse(await readBody(req));
  const interval = Number(form.check_interval);
  if (!Number.isFinite(interval) || interval < 5) { sendText(res, 400, 'Intervalo invalido'); return; }

  const monitorEnabled = form.monitor_enabled !== undefined;

  await withState(async (state) => {
    state.settings.check_interval = interval;
    state.settings.monitor_enabled = monitorEnabled;
    addEvent(state, 'info', `Configuracao salva. Intervalo: ${interval}s.`);
  });

  sendRedirect(res, '/');
}

async function handleToggleLink(req, res) {
  const form = parse(await readBody(req));
  const id = String(form.id || '').trim();
  if (!id) { sendText(res, 400, 'ID ausente'); return; }

  await withState(async (state) => {
    const link = state.links.find((item) => item.id === id);
    if (!link) return;
    link.enabled = !link.enabled;
    addEvent(state, 'info', `Link ${link.enabled ? 'ativado' : 'desativado'}: ${link.name}.`);
  });

  sendRedirect(res, '/');
}

async function handleDeleteLink(req, res) {
  const form = parse(await readBody(req));
  const id = String(form.id || '').trim();
  if (!id) { sendText(res, 400, 'ID ausente'); return; }

  await withState(async (state) => {
    const index = state.links.findIndex((item) => item.id === id);
    if (index === -1) return;
    const [removed] = state.links.splice(index, 1);
    addEvent(state, 'info', `Link removido: ${removed.name}.`);
  });

  sendRedirect(res, '/');
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    sendText(res, 200, renderDashboard(getAppState()), 'text/html; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') { sendText(res, 200, 'ok'); return; }
  if (req.method === 'POST' && url.pathname === '/links') { await handleAddLink(req, res); return; }
  if (req.method === 'POST' && url.pathname === '/settings') { await handleSettings(req, res); return; }
  if (req.method === 'POST' && url.pathname === '/links/toggle') { await handleToggleLink(req, res); return; }
  if (req.method === 'POST' && url.pathname === '/links/delete') { await handleDeleteLink(req, res); return; }

  sendText(res, 404, 'Not found');
}

module.exports = { requestHandler, sendText };
