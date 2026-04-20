const { DEFAULT_INTERVAL } = require('./config');
const { escapeHtml, displayStatusLabel } = require('./utils');

function renderPage(title, body) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script>
    (function() {
      var t = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f1f5f9;
      --card: #ffffff;
      --text: #0f172a;
      --text-2: #475569;
      --text-3: #94a3b8;
      --border: #e2e8f0;
      --accent: #6366f1;
      --accent-dark: #4f46e5;
      --accent-light: #eef2ff;
      --green: #10b981;
      --green-light: #d1fae5;
      --amber: #f59e0b;
      --amber-light: #fef3c7;
      --red: #ef4444;
      --red-light: #fee2e2;
      --blue: #3b82f6;
      --blue-light: #dbeafe;
      --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
      --shadow: 0 4px 16px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
      --shadow-lg: 0 10px 40px rgba(0,0,0,.1), 0 2px 8px rgba(0,0,0,.05);
      --radius: 14px;
      --radius-sm: 8px;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-size: 15px;
      line-height: 1.5;
    }

    /* ── Hero header ── */
    .hero {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      color: #fff;
      padding: 28px 0;
      margin-bottom: 28px;
      box-shadow: 0 4px 24px rgba(67,56,202,.35);
    }
    .hero-inner {
      width: min(1200px, calc(100% - 40px));
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .hero-left { display: flex; align-items: center; gap: 16px; }
    .hero-icon {
      width: 52px; height: 52px;
      background: rgba(255,255,255,.15);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,.2);
    }
    .hero-title { font-size: 1.55rem; font-weight: 700; letter-spacing: -.02em; }
    .hero-sub { font-size: .9rem; color: rgba(255,255,255,.65); margin-top: 2px; }
    .hero-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      font-weight: 600; font-size: .88rem;
      border: 1px solid rgba(255,255,255,.2);
    }
    .status-pill.active { background: rgba(16,185,129,.2); color: #6ee7b7; }
    .status-pill.paused { background: rgba(245,158,11,.2); color: #fcd34d; }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: currentColor;
    }
    .status-pill.active .pulse-dot {
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .4; transform: scale(.75); }
    }

    .refresh-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.15);
      font-size: .82rem; color: rgba(255,255,255,.7);
    }

    /* ── Layout ── */
    .wrap {
      width: min(1200px, calc(100% - 40px));
      margin: 0 auto;
      padding-bottom: 56px;
    }

    .notice {
      background: var(--blue-light);
      border: 1px solid #bfdbfe;
      color: #1e40af;
      border-radius: var(--radius);
      padding: 13px 18px;
      margin-bottom: 22px;
      font-size: .92rem;
      display: flex; align-items: center; gap: 10px;
    }
    .notice.warn {
      background: var(--amber-light);
      border-color: #fde68a;
      color: #92400e;
    }
    .notice-icon { font-size: 1.1rem; flex-shrink: 0; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      align-items: start;
    }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
    }
    .card-title {
      font-size: 1.05rem; font-weight: 700;
      color: var(--text);
      margin-bottom: 18px;
      display: flex; align-items: center; gap: 8px;
    }
    .card-title-icon {
      width: 32px; height: 32px;
      background: var(--accent-light);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }

    /* ── Forms ── */
    .form-group { margin-bottom: 14px; }
    .form-group:last-child { margin-bottom: 0; }
    label {
      display: block;
      font-size: .85rem;
      font-weight: 600;
      color: var(--text-2);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: .03em;
    }
    input[type="text"],
    input[type="url"],
    input[type="number"] {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font: inherit; font-size: .95rem;
      color: var(--text);
      background: #fafafa;
      transition: border-color .15s, box-shadow .15s;
      outline: none;
    }
    input[type="text"]:focus,
    input[type="url"]:focus,
    input[type="number"]:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(99,102,241,.12);
      background: #fff;
    }
    .checkbox-label {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: .95rem; font-weight: 500;
      color: var(--text);
      cursor: pointer;
      text-transform: none; letter-spacing: 0;
    }
    input[type="checkbox"] {
      width: 16px; height: 16px;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }
    .form-actions { margin-top: 18px; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      border: 0; border-radius: var(--radius-sm);
      padding: 9px 18px;
      cursor: pointer; font: inherit; font-weight: 600; font-size: .9rem;
      transition: filter .15s, transform .1s;
      white-space: nowrap;
    }
    .btn:active { transform: scale(.97); }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { filter: brightness(1.1); }
    .btn-gray { background: #e2e8f0; color: #475569; }
    .btn-gray:hover { background: #cbd5e1; }
    .btn-danger { background: var(--red); color: #fff; }
    .btn-danger:hover { filter: brightness(1.1); }
    .btn-sm { padding: 6px 12px; font-size: .82rem; }

    /* ── Table ── */
    .table-wrap {
      overflow-x: auto;
      margin-top: 4px;
    }
    table {
      width: 100%; border-collapse: collapse;
      min-width: 700px;
    }
    thead th {
      text-align: left;
      padding: 10px 14px;
      font-size: .78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .06em;
      color: var(--text-3);
      border-bottom: 1.5px solid var(--border);
      white-space: nowrap;
    }
    tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background .1s;
    }
    tbody tr:last-child { border-bottom: 0; }
    tbody tr:hover { background: #f8fafc; }
    td {
      padding: 13px 14px;
      vertical-align: middle;
      font-size: .92rem;
    }
    .td-name { font-weight: 600; }
    .td-id { font-size: .75rem; color: var(--text-3); font-family: monospace; margin-top: 2px; }
    .td-url a {
      color: var(--accent); text-decoration: none;
      word-break: break-all; font-size: .85rem;
    }
    .td-url a:hover { text-decoration: underline; }
    .td-actions { white-space: nowrap; }
    .td-actions form { display: inline; margin-right: 6px; }
    .td-meta { font-size: .82rem; color: var(--text-2); white-space: nowrap; }
    .td-meta span { display: block; color: var(--text-3); font-size: .76rem; margin-top: 1px; }
    .empty-row td {
      text-align: center; color: var(--text-3);
      padding: 32px; font-size: .92rem;
    }

    /* ── Badges ── */
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: .78rem; font-weight: 700;
      white-space: nowrap;
    }
    .badge-ok    { background: var(--green-light); color: #065f46; }
    .badge-off   { background: #f1f5f9;            color: #64748b; }
    .badge-warn  { background: var(--amber-light); color: #78350f; }
    .badge-err   { background: var(--red-light);   color: #991b1b; }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor; flex-shrink: 0;
    }
    .enabled-yes { color: var(--green); font-weight: 600; font-size: .88rem; }
    .enabled-no  { color: var(--text-3); font-size: .88rem; }

    /* ── Section header ── */
    .section-header {
      display: flex; align-items: center;
      justify-content: space-between; flex-wrap: wrap; gap: 8px;
      margin-bottom: 16px;
    }
    .count-pill {
      background: var(--accent-light); color: var(--accent);
      border-radius: 999px; padding: 3px 10px;
      font-size: .8rem; font-weight: 700;
    }

    /* ── Event log ── */
    .event-list { list-style: none; }
    .event-item {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .event-item:last-child { border-bottom: 0; }
    .event-bar {
      width: 3px; min-height: 36px; border-radius: 4px;
      flex-shrink: 0; margin-top: 2px;
    }
    .event-bar.info  { background: var(--blue); }
    .event-bar.alert { background: var(--amber); }
    .event-bar.error { background: var(--red); }
    .event-time {
      font-size: .78rem; color: var(--text-3); font-family: monospace;
      white-space: nowrap; padding-top: 1px;
      min-width: 80px;
    }
    .event-level {
      font-size: .72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .05em; padding-top: 1px; min-width: 40px;
    }
    .event-level.info  { color: var(--blue); }
    .event-level.alert { color: var(--amber); }
    .event-level.error { color: var(--red); }
    .event-msg { font-size: .92rem; color: var(--text-2); padding-top: 1px; }
    .event-empty { color: var(--text-3); font-size: .92rem; padding: 24px 0; text-align: center; }

    /* ── Responsive ── */
    @media (max-width: 860px) {
      .grid-2 { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .hero-inner { flex-direction: column; align-items: flex-start; }
    }

    /* ── Dark mode toggle button ── */
    .dark-toggle {
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 999px;
      padding: 7px 13px;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      transition: background .15s;
    }
    .dark-toggle:hover { background: rgba(255,255,255,.22); }

    /* ── Dark mode ── */
    [data-theme="dark"] {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f1f5f9;
      --text-2: #94a3b8;
      --text-3: #64748b;
      --border: #334155;
      --accent-light: #1e1b4b;
      --green-light: #064e3b;
      --amber-light: #451a03;
      --red-light: #450a0a;
      --blue-light: #172554;
    }
    [data-theme="dark"] input[type="text"],
    [data-theme="dark"] input[type="url"],
    [data-theme="dark"] input[type="number"] {
      background: #0f172a; color: var(--text); border-color: var(--border);
    }
    [data-theme="dark"] input[type="text"]:focus,
    [data-theme="dark"] input[type="url"]:focus,
    [data-theme="dark"] input[type="number"]:focus { background: #0f172a; }
    [data-theme="dark"] tbody tr:hover { background: #263244; }
    [data-theme="dark"] .btn-gray { background: #334155; color: #94a3b8; }
    [data-theme="dark"] .btn-gray:hover { background: #475569; }
    [data-theme="dark"] .badge-off { background: #1e293b; color: #64748b; }
    [data-theme="dark"] .notice { background: #172554; border-color: #1d4ed8; color: #93c5fd; }
    [data-theme="dark"] .notice.warn { background: #451a03; border-color: #92400e; color: #fcd34d; }
    [data-theme="dark"] .count-pill { background: #1e1b4b; }
    [data-theme="dark"] .card-title-icon { background: #1e1b4b; }
  </style>
</head>
<body>
  ${body}
  <script>
    (function() {
      var el = document.getElementById('refresh-countdown');
      if (el) {
        var secs = 30;
        var iv = setInterval(function() {
          secs--;
          if (secs <= 0) { clearInterval(iv); location.reload(); return; }
          el.textContent = secs + 's';
        }, 1000);
      }

      var btn = document.getElementById('dark-toggle');
      if (btn) {
        var theme = document.documentElement.getAttribute('data-theme') || 'light';
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.addEventListener('click', function() {
          var current = document.documentElement.getAttribute('data-theme');
          var next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('theme', next);
          btn.textContent = next === 'dark' ? '☀️' : '🌙';
        });
      }
    })();
  </script>
</body>
</html>`;
}

function renderDashboard(state) {
  const { settings, links } = state;
  const events = state.events.slice(-15).reverse();
  const isActive = settings.monitor_enabled;
  const pushReady = Boolean(String(process.env.PUSHOVER_USER || '').trim()) &&
    Boolean(String(process.env.PUSHOVER_TOKEN || '').trim());

  const rows = links.map((link) => {
    const status = link.last_status || 'nunca verificado';
    let badgeClass = 'badge-warn';
    if (/erro/i.test(status))    badgeClass = 'badge-err';
    else if (/disp/i.test(status)) badgeClass = 'badge-ok';
    else if (/esgot/i.test(status)) badgeClass = 'badge-off';
    else if (/inconclus/i.test(status)) badgeClass = 'badge-warn';
    const label = displayStatusLabel(status);

    return `<tr>
      <td>
        <div class="td-name">${escapeHtml(link.name)}</div>
        <div class="td-id">${escapeHtml(link.id)}</div>
      </td>
      <td class="td-url"><a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.url)}</a></td>
      <td>${link.enabled
        ? '<span class="enabled-yes">&#10003; Sim</span>'
        : '<span class="enabled-no">Nao</span>'}</td>
      <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${escapeHtml(label)}</span></td>
      <td class="td-meta">
        ${escapeHtml(link.last_checked || '—')}
        ${link.last_error ? `<span title="${escapeHtml(link.last_error)}">Erro recente</span>` : ''}
      </td>
      <td class="td-meta">${escapeHtml(link.last_alert_at || '—')}</td>
      <td class="td-actions">
        <form method="post" action="/links/toggle">
          <input type="hidden" name="id" value="${escapeHtml(link.id)}">
          <button class="btn btn-gray btn-sm" type="submit">${link.enabled ? 'Desativar' : 'Ativar'}</button>
        </form>
        <form method="post" action="/links/delete" onsubmit="return confirm('Remover este link?');">
          <input type="hidden" name="id" value="${escapeHtml(link.id)}">
          <button class="btn btn-danger btn-sm" type="submit">Excluir</button>
        </form>
      </td>
    </tr>`;
  }).join('');

  const eventItems = events.length === 0
    ? '<p class="event-empty">Nenhum evento registrado ainda.</p>'
    : events.map((ev) => {
        const lvl = String(ev.level || 'info').toLowerCase();
        return `<li class="event-item">
          <div class="event-bar ${lvl}"></div>
          <div class="event-time">${escapeHtml(ev.time)}</div>
          <div class="event-level ${lvl}">${escapeHtml(ev.level)}</div>
          <div class="event-msg">${escapeHtml(ev.message)}</div>
        </li>`;
      }).join('');

  return renderPage('Monitor de Ingressos', `
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-left">
          <div class="hero-icon">🎟️</div>
          <div>
            <div class="hero-title">Monitor de Ingressos</div>
            <div class="hero-sub">Monitoramento automatico com alertas via Pushover</div>
          </div>
        </div>
        <div class="hero-right">
          <span class="status-pill ${isActive ? 'active' : 'paused'}">
            <span class="pulse-dot"></span>
            ${isActive ? 'Monitor Ativo' : 'Monitor Pausado'}
          </span>
          <span class="refresh-pill">&#8635; <span id="refresh-countdown">30s</span></span>
          <button class="dark-toggle" id="dark-toggle" title="Alternar tema">🌙</button>
        </div>
      </div>
    </div>

    <div class="wrap">
      <div class="notice ${pushReady ? '' : 'warn'}">
        <span class="notice-icon">${pushReady ? 'ℹ️' : '⚠️'}</span>
        ${pushReady
          ? 'Pushover configurado e pronto para envio de alertas.'
          : 'Configure <strong>PUSHOVER_USER</strong> e <strong>PUSHOVER_TOKEN</strong> no arquivo <code>.env</code> para os alertas funcionarem.'}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">
            <div class="card-title-icon">➕</div>
            Adicionar Link
          </div>
          <form method="post" action="/links">
            <div class="form-group">
              <label for="name">Nome</label>
              <input id="name" name="name" type="text" placeholder="Ex.: Ticketmaster BTS">
            </div>
            <div class="form-group">
              <label for="url">URL</label>
              <input id="url" name="url" type="url" placeholder="https://..." required>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" name="enabled" checked> Ativar imediatamente
              </label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Adicionar Link</button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="card-title">
            <div class="card-title-icon">⚙️</div>
            Configuracoes
          </div>
          <form method="post" action="/settings">
            <div class="form-group">
              <label for="check_interval">Intervalo de checagem (segundos)</label>
              <input id="check_interval" name="check_interval" type="number"
                min="5" step="1"
                value="${Number(settings.check_interval) || DEFAULT_INTERVAL}"
                required>
            </div>
            <div class="form-group" style="margin-top: 8px;">
              <label class="checkbox-label">
                <input type="checkbox" name="monitor_enabled" ${settings.monitor_enabled ? 'checked' : ''}>
                Monitor ativo
              </label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Salvar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card" style="margin-bottom: 20px;">
        <div class="section-header">
          <div class="card-title" style="margin-bottom:0;">
            <div class="card-title-icon">🔗</div>
            Links Monitorados
          </div>
          <span class="count-pill">${links.length} link(s)</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>URL</th>
                <th>Ativo</th>
                <th>Status</th>
                <th>Ultima Checagem</th>
                <th>Ultimo Alerta</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr class="empty-row"><td colspan="7">Nenhum link cadastrado.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="card-title" style="margin-bottom:0;">
            <div class="card-title-icon">📋</div>
            Eventos Recentes
          </div>
          <span class="count-pill">ultimos 15</span>
        </div>
        <ul class="event-list">
          ${eventItems}
        </ul>
      </div>
    </div>
  `);
}

module.exports = { renderPage, renderDashboard };
