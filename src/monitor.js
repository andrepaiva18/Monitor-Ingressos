const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { CHECK_TIMEOUT_MS, DEFAULT_INTERVAL, BASE_DIR, loadDotEnv } = require('./config');
const { nowLabel, nowIso, stripHtml, sleep, classifyStatus } = require('./utils');
const { snapshotState, withState, addEvent } = require('./state');

let stopRequested = false;

function findBrowserExecutable() {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function dumpDomWithBrowser(url) {
  const browserPath = findBrowserExecutable();
  if (!browserPath) throw new Error('Nenhum navegador headless encontrado no servidor.');

  const args = [
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--no-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '--dump-dom', '--virtual-time-budget=15000', url
  ];

  return new Promise((resolve, reject) => {
    execFile(
      browserPath, args,
      { timeout: CHECK_TIMEOUT_MS + 15000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && !stdout) { reject(new Error(stderr || error.message)); return; }
        resolve(String(stdout || ''));
      }
    );
  });
}

async function fetchPageText(link) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(link.url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    return stripHtml(html);
  } finally {
    clearTimeout(timeout);
  }
}

function sendPush(title, message) {
  loadDotEnv(path.join(BASE_DIR, '.env'));
  const user = String(process.env.PUSHOVER_USER || '').trim();
  const token = String(process.env.PUSHOVER_TOKEN || '').trim();

  if (!user || !token) {
    throw new Error('Pushover nao configurado. Defina PUSHOVER_USER e PUSHOVER_TOKEN.');
  }

  return fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token, user, title, message, priority: '2', retry: 30, expire: 300
    })
  }).then((response) => {
    if (!response.ok) throw new Error(`Pushover retornou HTTP ${response.status}`);
  });
}

class MonitorWorker {
  constructor() { this.running = false; }

  async start() {
    if (this.running) return;
    this.running = true;
    console.log(`[${nowLabel()}] Monitor iniciado.`);
    this.loop().catch((error) => {
      console.error(`[${nowLabel()}] Falha no monitor:`, error);
    });
  }

  async loop() {
    while (!stopRequested) {
      const state = snapshotState();

      if (!state.settings.monitor_enabled) {
        await sleep(5000);
        continue;
      }

      const intervalMs = Math.max(5000, Number(state.settings.check_interval || DEFAULT_INTERVAL) * 1000);
      const activeLinks = state.links.filter((link) => link.enabled);

      if (activeLinks.length === 0) {
        await sleep(intervalMs);
        continue;
      }

      for (const link of activeLinks) {
        if (stopRequested) break;
        await this.checkOne(link);
      }

      await sleep(intervalMs);
    }
  }

  async checkOne(link) {
    try {
      const status = await this.detectStatus(link);
      await withState(async (state) => {
        const current = state.links.find((item) => item.id === link.id);
        if (!current) return;

        current.last_status = status;
        current.last_checked = nowIso();
        current.last_error = null;

        if (status === 'ESGOTADO') { current.alerted = false; return; }
        if (status === 'INCONCLUSIVO') { current.alerted = false; return; }
        if (current.alerted) return;

        const title = `🚨 ${current.name}`;
        const message = `Ingresso possivelmente disponivel.\n${current.url}`;

        try {
          await sendPush(title, message);
          current.alerted = true;
          current.last_alert_at = nowIso();
          addEvent(state, 'alert', `Alerta enviado para ${current.name}.`);
        } catch (pushError) {
          current.alerted = true;
          current.last_alert_at = nowIso();
          current.last_error = String(pushError.message || pushError);
          addEvent(state, 'error', `Falha ao enviar push para ${current.name}: ${current.last_error}`);
        }
      });
    } catch (error) {
      await withState(async (state) => {
        const current = state.links.find((item) => item.id === link.id);
        if (!current) return;
        current.last_status = 'ERRO';
        current.last_checked = nowIso();
        current.last_error = String(error.message || error);
        addEvent(state, 'error', `Falha ao verificar ${current.name}: ${current.last_error}`);
      });
    }
  }

  async stop() { this.running = false; }

  async detectStatus(link) {
    try {
      const dom = await dumpDomWithBrowser(link.url);
      const text = stripHtml(dom);
      if (text.length > 200) {
        const status = classifyStatus(text);
        if (status !== 'INCONCLUSIVO') return status;
      }
    } catch (error) {
      console.error(`[${nowLabel()}] Browser headless falhou para ${link.url}:`, error.message || error);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
      try {
        const response = await fetch(link.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        });
        if (response.ok) {
          const html = await response.text();
          if (html.length > 200) return classifyStatus(html);
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // silencioso
    }

    return 'INCONCLUSIVO';
  }
}

function setStopRequested(value) { stopRequested = value; }

module.exports = { MonitorWorker, sendPush, setStopRequested };
