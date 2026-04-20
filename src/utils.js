const crypto = require('crypto');
const { SOLD_OUT_KEYWORDS } = require('./config');

function nowIso() {
  return new Date().toISOString().slice(0, 19);
}

function nowLabel() {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false });
}

function randomId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function classifyStatus(text) {
  const lower = String(text || '').toLowerCase();
  if (SOLD_OUT_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return 'ESGOTADO';
  }
  return 'POSSIVELMENTE DISPONIVEL';
}

function displayStatusLabel(status) {
  if (status === 'POSSIVELMENTE DISPONIVEL') return 'INGRESSOS ENCONTRADOS';
  if (status === 'INCONCLUSIVO') return 'SEM CONFIRMACAO';
  return status;
}

module.exports = {
  nowIso, nowLabel, randomId, escapeHtml, stripHtml,
  sleep, validateUrl, classifyStatus, displayStatusLabel
};
