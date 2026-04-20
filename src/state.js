const fs = require('fs');
const path = require('path');
const { STATE_FILE, DEFAULT_LINKS, DEFAULT_INTERVAL, MAX_EVENTS } = require('./config');
const { randomId, nowIso } = require('./utils');

let appState = null;
let stateQueue = Promise.resolve();

function createLink(name, url, enabled = true) {
  return {
    id: randomId(),
    name,
    url,
    enabled,
    alerted: false,
    last_status: 'nunca verificado',
    last_checked: null,
    last_alert_at: null,
    last_error: null
  };
}

function createDefaultState() {
  return {
    settings: {
      check_interval: DEFAULT_INTERVAL,
      monitor_enabled: true
    },
    links: DEFAULT_LINKS.map((item) => createLink(item.name, item.url, true)),
    events: []
  };
}

function normalizeState(raw) {
  const state = createDefaultState();

  if (!raw || typeof raw !== 'object') return state;

  if (raw.settings && typeof raw.settings === 'object') {
    const interval = Number(raw.settings.check_interval);
    if (Number.isFinite(interval)) state.settings.check_interval = interval;
    state.settings.monitor_enabled = Boolean(raw.settings.monitor_enabled);
  }

  if (Array.isArray(raw.links) && raw.links.length > 0) {
    const links = [];
    for (const item of raw.links) {
      if (!item || typeof item !== 'object') continue;
      const url = String(item.url || '').trim();
      if (!url) continue;
      links.push({
        id: String(item.id || randomId()),
        name: String(item.name || url),
        url,
        enabled: Boolean(item.enabled),
        alerted: Boolean(item.alerted),
        last_status: String(item.last_status || 'nunca verificado'),
        last_checked: item.last_checked || null,
        last_alert_at: item.last_alert_at || null,
        last_error: item.last_error || null
      });
    }
    if (links.length > 0) state.links = links;
  }

  if (Array.isArray(raw.events)) {
    state.events = raw.events.slice(-MAX_EVENTS);
  }

  return state;
}

async function loadState() {
  try {
    const file = await fs.promises.readFile(STATE_FILE, 'utf8');
    return normalizeState(JSON.parse(file));
  } catch {
    const state = createDefaultState();
    await saveState(state);
    return state;
  }
}

async function saveState(state) {
  await fs.promises.mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tempFile = `${STATE_FILE}.tmp`;
  await fs.promises.writeFile(tempFile, JSON.stringify(state, null, 2), 'utf8');
  await fs.promises.rename(tempFile, STATE_FILE);
}

function snapshotState() {
  return JSON.parse(JSON.stringify(appState));
}

function withState(mutator, persist = true) {
  const run = stateQueue.then(async () => {
    const result = await mutator(appState);
    if (persist) await saveState(appState);
    return result;
  });
  stateQueue = run.catch(() => {});
  return run;
}

function addEvent(state, level, message) {
  state.events.push({ time: nowIso(), level, message });
  state.events = state.events.slice(-MAX_EVENTS);
}

function getAppState() { return appState; }
function setAppState(state) { appState = state; }

module.exports = {
  createLink, createDefaultState, normalizeState,
  loadState, saveState, snapshotState, withState,
  addEvent, getAppState, setAppState
};
