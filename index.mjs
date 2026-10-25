import http from 'node:http';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const LOCAL_DEV_ORIGINS = ['null', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'];

export function loadConfig(env = process.env) {
  const fromEnv = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  const production = env.NODE_ENV === 'production';
  return {
    port: Number(env.PORT || 3000),
    host: env.HOST || '127.0.0.1',
    // Ohne ALLOWED_ORIGIN: lokal nur Entwicklungs-Origins, in Produktion keine.
    allowedOrigins: fromEnv.length ? fromEnv : (production ? [] : LOCAL_DEV_ORIGINS),
    token: env.API_TOKEN || '',
    rateLimit: Number(env.RATE_LIMIT || 60) // Anfragen pro Minute und Adresse
  };
}

function corsHeaders(req, cfg) {
  const h = { vary: 'Origin' };
  const origin = req.headers.origin;
  if (origin && cfg.allowedOrigins.includes(origin)) {
    h['access-control-allow-origin'] = origin;
    h['access-control-allow-methods'] = 'GET,POST,OPTIONS';
    h['access-control-allow-headers'] = 'content-type,authorization';
  }
  return h;
}

function send(req, res, cfg, status, data) {
  const headers = { 'cache-control': 'no-store', ...corsHeaders(req, cfg) };
  if (status === 204) { res.writeHead(204, headers); return res.end(); }
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(data));
}

function tokenOk(req, token) {
  const given = String(req.headers.authorization || '');
  const want = `Bearer ${token}`;
  const a = Buffer.from(given), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const ALLOWED_QUALITY = ['low', 'medium', 'high'];

export function analyse(body = {}) {
  const symptom = typeof body.symptom === 'string' ? body.symptom.trim().slice(0, 2000) : '';
  const observations = Array.isArray(body.observations) ? body.observations.slice(0, 30) : [];
  const evidenceQuality = ALLOWED_QUALITY.includes(body.quality) ? body.quality : 'unknown';
  const checklist = [
    'Das ist nur eine vorläufige Checkliste, keine bestätigte Diagnose.',
    'Trenne geprüfte Messwerte von berichteten Symptomen und Annahmen.',
    'Prüfe die Zuordnung des Stromkreises und die Eignung des Messgeräts, bevor du Werten vertraust.',
    'Nutze das gültige, anerkannte Prüfverfahren und eine Elektrofachkraft.'
  ];
  if (body.rcd === 'trips' || /trip|abschalt|auslös|ausgelöst|löst\s+aus|fliegt\s+raus|fällt\s+raus|\bfi\b|\brcd\b/i.test(symptom)) {
    checklist.push('Eine Auslösung kann mehrere Ursachen haben. Schließe nicht allein vom Symptom auf eine Ursache.');
  }
  if (body.rcd === 'stable') {
    checklist.push('Keine Auslösung heißt nicht: Die Anlage ist sicher.');
  }
  return {
    status: 'preliminary_only',
    diagnosisConfirmed: false,
    installationSafetyCertified: false,
    fictionalOrUserProvidedData: true,
    evidenceQuality,
    symptom,
    observations,
    checklist,
    missingEvidence: ['geprüfter Stromkreisplan', 'Messgerät mit Hersteller, Typ und Kalibrierstatus', 'Prüfbedingungen', 'relevante Messwerte'],
    warning: 'Nutze diese Antwort nie als einzige Grundlage für Arbeiten an der Anlage oder für eine Sicherheitsentscheidung.'
  };
}

export function createApp(overrides = {}) {
  const cfg = { ...loadConfig(), ...overrides };
  const hits = new Map(); // Adresse -> { count, reset }

  function limited(req) {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    const key = req.socket.remoteAddress || 'unknown';
    const entry = hits.get(key) || { count: 0, reset: now + 60_000 };
    entry.count += 1;
    hits.set(key, entry);
    return entry.count > cfg.rateLimit;
  }

  return http.createServer(async (req, res) => {
    const reply = (status, data) => send(req, res, cfg, status, data);
    if (req.method === 'OPTIONS') return reply(204);
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      return reply(200, { ok: true, service: 'elektropilot-boxscanb-api', mode: 'prototype' });
    }
    if (url.pathname.startsWith('/api/')) {
      if (limited(req)) return reply(429, { error: 'Zu viele Anfragen' });
      if (cfg.token && !tokenOk(req, cfg.token)) return reply(401, { error: 'Nicht autorisiert' });
    }
    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 100_000) return reply(413, { error: 'Anfrage zu groß' });
      }
      let body;
      try { body = JSON.parse(raw || '{}'); }
      catch { return reply(400, { error: 'Ungültiges JSON' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return reply(400, { error: 'Der JSON-Inhalt muss ein Objekt sein' });
      }
      return reply(200, analyse(body));
    }
    return reply(404, { error: 'Nicht gefunden' });
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const cfg = loadConfig();
  createApp(cfg).listen(cfg.port, cfg.host, () => console.log(`ElektroPilot API läuft auf ${cfg.host}:${cfg.port}`));
}
