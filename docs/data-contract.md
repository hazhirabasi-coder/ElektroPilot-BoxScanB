# Data contract v0.1

This contract describes a proposed shape, not a finalized meter protocol.

```json
{
  "schemaVersion": "0.1",
  "source": "meter_interface",
  "deviceId": "provisioned-device-id",
  "meter": {
    "manufacturer": "required",
    "model": "required",
    "registerMapVersion": "required"
  },
  "capturedAt": "RFC3339 timestamp",
  "clockValid": false,
  "measurementValid": false,
  "measurements": [
    {
      "metric": "manufacturer-defined metric identifier",
      "value": 0,
      "unit": "manufacturer-defined unit",
      "valid": false,
      "status": "not_implemented"
    }
  ]
}
```

Requirements:
- `capturedAt` may be `null` only while `clockValid` is `false` (for example in the fictional demo case).
- Unknown metric identifiers are rejected or retained as unknown, never reinterpreted.
- Include a source timestamp and server receipt timestamp.
- Invalid, stale, or unverified measurements must not be presented as trustworthy.
- The circuit/MCB label map is separate data and needs verified manual mapping or additional supported sensing; it cannot be inferred from a generic meter reading.
