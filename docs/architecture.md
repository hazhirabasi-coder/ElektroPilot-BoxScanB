# Architecture

## Data path

Supported certified meter/interface → documented isolated communication → BoxScan firmware → authenticated TLS API → browser app → preliminary evidence checklist.

The device-to-meter protocol is not selected. No live hardware data path exists yet.

## Data integrity requirements

Every future measurement should include:
- device and meter identifiers
- metric name, value, unit and scale
- timestamp and clock-quality status
- source and protocol/register-map version
- validity flag and error/status code
- calibration / instrument verification metadata when applicable

Missing or stale values must remain explicitly missing or stale. Never silently replace them with defaults or fictional values.

## Trust boundaries

- Treat device data as untrusted input.
- Authenticate devices independently from user sessions.
- Use TLS with proper certificate validation; never ship placeholder certificates or disable validation.
- Store secrets in deployment secret management, not source control.
- Add rate limiting, payload validation, audit logging, privacy retention rules and authorization before production.
