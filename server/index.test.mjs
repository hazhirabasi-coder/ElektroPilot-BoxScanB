import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyse, createApp } from './index.mjs';

test('analysis never claims confirmed diagnosis or safety certification', () => {
  const result = analyse({ symptom: 'RCD trips intermittently' });
  assert.equal(result.diagnosisConfirmed, false);
  assert.equal(result.installationSafetyCertified, false);
  assert.equal(result.status, 'preliminary_only');
  assert.ok(result.checklist.length >= 4);
});

test('unknown input is handled safely', () => {
  const result = analyse({});
  assert.equal(result.symptom, '');
  assert.equal(result.evidenceQuality, 'unknown');
  assert.ok(Array.isArray(result.missingEvidence));
});

test('symptom text is bounded', () => {
  assert.equal(analyse({ symptom: 'x'.repeat(5000) }).symptom.length, 2000);
});

test('German tripping phrases add the protective-device note', () => {
  for (const text of ['FI löst aus', 'FI hat ausgelöst', 'Abschaltung ohne Grund', 'Sicherung fliegt raus']) {
    assert.ok(analyse({ symptom: text }).checklist.length > 4, text);
  }
});

test('unrelated symptom adds no note; rcd field is honoured', () => {
  assert.equal(analyse({ symptom: 'Lampe flackert' }).checklist.length, 4);
  assert.equal(analyse({ rcd: 'trips' }).checklist.length, 5);
  assert.equal(analyse({ rcd: 'stable' }).checklist.length, 5);
});

async function withServer(overrides, fn) {
  const server = createApp(overrides);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { await new Promise((r) => server.close(r)); }
}

const post = (base, body, headers = {}) => fetch(`${base}/api/analyze`, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body
});

test('HTTP: health, analyze, errors', async () => {
  await withServer({ allowedOrigins: [], token: '', rateLimit: 100 }, async (base) => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const ok = await post(base, JSON.stringify({ symptom: 'FI löst aus' }));
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).diagnosisConfirmed, false);
    assert.equal((await post(base, '{bad')).status, 400);
    assert.equal((await post(base, '[]')).status, 400);
    assert.equal((await fetch(`${base}/nope`)).status, 404);
  });
});

test('HTTP: token is required when API_TOKEN is set', async () => {
  await withServer({ allowedOrigins: [], token: 'geheim', rateLimit: 100 }, async (base) => {
    assert.equal((await post(base, '{}')).status, 401);
    assert.equal((await post(base, '{}', { authorization: 'Bearer falsch' })).status, 401);
    assert.equal((await post(base, '{}', { authorization: 'Bearer geheim' })).status, 200);
    assert.equal((await fetch(`${base}/health`)).status, 200);
  });
});

test('HTTP: CORS only for allowed origins', async () => {
  await withServer({ allowedOrigins: ['https://app.example'], token: '', rateLimit: 100 }, async (base) => {
    const good = await fetch(`${base}/health`, { headers: { origin: 'https://app.example' } });
    assert.equal(good.headers.get('access-control-allow-origin'), 'https://app.example');
    const bad = await fetch(`${base}/health`, { headers: { origin: 'https://evil.example' } });
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
    const pre = await fetch(`${base}/api/analyze`, { method: 'OPTIONS', headers: { origin: 'https://app.example' } });
    assert.equal(pre.status, 204);
  });
});

test('HTTP: rate limit returns 429', async () => {
  await withServer({ allowedOrigins: [], token: '', rateLimit: 2 }, async (base) => {
    assert.equal((await post(base, '{}')).status, 200);
    assert.equal((await post(base, '{}')).status, 200);
    assert.equal((await post(base, '{}')).status, 429);
  });
});

test('demo case matches the data contract and contains no fake measurements', () => {
  const demo = JSON.parse(readFileSync(new URL('../data/demo-case.json', import.meta.url), 'utf8'));
  for (const k of ['schemaVersion', 'source', 'deviceId', 'meter', 'capturedAt', 'clockValid', 'measurementValid', 'measurements']) {
    assert.ok(k in demo, `missing ${k}`);
  }
  for (const k of ['manufacturer', 'model', 'registerMapVersion']) assert.ok(k in demo.meter, `meter.${k}`);
  assert.equal(demo.measurementValid, false);
  assert.equal(demo.clockValid, false);
  assert.deepEqual(demo.measurements, []);
});
