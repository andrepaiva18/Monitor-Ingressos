const path = require('path');
const fs = require('fs');

const BASE_DIR = path.join(__dirname, '..');

function loadDotEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;

      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && (!process.env[key] || process.env[key].trim() === '')) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Falha ao ler .env:`, error);
    }
  }
}

loadDotEnv(path.join(BASE_DIR, '.env'));

module.exports = {
  BASE_DIR,
  STATE_FILE: process.env.BOT_STATE_FILE || path.join(BASE_DIR, 'data', 'state.json'),
  HOST: process.env.BOT_HOST || '0.0.0.0',
  PORT: Number(process.env.BOT_PORT || 8000),
  DEFAULT_INTERVAL: Number(process.env.BOT_CHECK_INTERVAL || 5),
  CHECK_TIMEOUT_MS: Number(process.env.BOT_CHECK_TIMEOUT_MS || 50),
  DEFAULT_LINKS: [
    { name: 'Ticketmaster BTS 1', url: 'https://www.ticketmaster.com.br/event/venda-geral-bts-world-tour-arirang-28-10' },
    { name: 'Ticketmaster BTS 2', url: 'https://www.ticketmaster.com.br/event/venda-geral-bts-world-tour-arirang-30-10' },
    { name: 'Ticketmaster BTS 3', url: 'https://www.ticketmaster.com.br/event/venda-geral-bts-world-tour-arirang-31-10' }
  ],
  SOLD_OUT_KEYWORDS: ['ESGOTADO', 'sold_out', 'soldout', 'sold-out', 'off-sale', 'offsale'],
  AVAILABLE_KEYWORDS: [
    'comprar ingresso', 'comprar ingressos', 'selecionar ingressos',
    'escolha seus ingressos', 'ver ingressos', 'disponivel'
  ],
  MAX_EVENTS: 120,
  loadDotEnv
};
