# ElektroPilot AI / BoxScan B

Independent project repository for a prototype electrical-diagnostics assistant and a future data-acquisition device.

## Current status

This package is a **software/hardware scaffold**, not a finished product.
- The browser app demonstrates evidence-based, rule-based triage using user-entered demo data.
- The API provides health and analysis endpoints.
- Firmware is intentionally a safe scaffold: real meter/register polling is disabled until a specific supported meter, register map, electrical design, and test plan are reviewed.
- Demo readings are fictional. They are not measurements and must not be used to make electrical safety decisions.

## Safety boundary

Never connect an unreviewed prototype to mains voltage or an electrical distribution board. Use certified, appropriately rated measurement equipment and a qualified electrical professional. This tool is not a substitute for DIN/VDE-compliant inspection, measurement, or judgement, and must never certify an installation as safe.

## Quick start: browser app

Open `app/index.html` in a modern browser. It works without an API and clearly labels its output as a preliminary checklist.

## Quick start: API

Requires Node.js 20+.

```sh
cd server
npm test
npm start
```

The API listens on `127.0.0.1:3000` by default (local only). Settings via environment variables:

- `PORT`, `HOST` — use `HOST=0.0.0.0` only inside a container or behind a reverse proxy.
- `ALLOWED_ORIGIN` — comma-separated list of allowed browser origins. Without it, only local development origins are allowed; with `NODE_ENV=production`, none are.
- `API_TOKEN` — if set, every `/api/*` request needs `Authorization: Bearer <token>`. `/health` stays open.
- `RATE_LIMIT` — requests per minute per address (default 60). Behind a proxy, use the proxy's own limit as well.

Before any public deployment: use https, set `ALLOWED_ORIGIN` and `API_TOKEN`, and add real authentication, logging and privacy rules.

The browser app can call the API (optional "Server" field). Without a server it uses its built-in local checklist.

## Project structure

- `app/` — browser demo
- `server/` — minimal Node.js API and tests
- `hardware/boxscan-b/` — firmware scaffold and hardware notes
- `data/` — fictional demo case
- `docs/` — architecture, safety, data contract, validation plan
- `.github/workflows/` — basic automated checks

## Next milestones

1. Select a specific certified meter / measurement interface.
2. Review electrical isolation, enclosure, creepage/clearance, overvoltage category, fusing, and applicable standards with a qualified engineer.
3. Define and verify the exact register map and data quality rules.
4. Build and test a low-voltage bench prototype first.
5. Threat-model the device/API authentication and deploy with managed secrets.
6. Validate recommendations against expert-reviewed cases before any field use.
