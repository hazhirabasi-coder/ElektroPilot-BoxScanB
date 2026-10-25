# BoxScan B — hardware scaffold

## Do not connect to mains yet

No physical prototype is included. This folder does not define a complete, certified mains measurement design. Do not connect an ESP32, USB interface, prototype PCB, or unreviewed circuit directly to a distribution board.

## Architecture concept

1. A **specific, appropriately certified meter/interface** performs measurements.
2. A documented and isolated communication interface (possibly RS-485, if supported by the chosen meter) transfers readings.
3. Firmware validates units, timestamps, device identity, and data quality.
4. The device sends data over authenticated TLS to a backend.
5. The app displays source, age, quality, and uncertainty with each value.

## Blocking decisions before implementation

- Exact meter manufacturer/model and supported protocol.
- Official register map, scale factors, signedness, endianness, update rate and error codes.
- Electrical isolation and protection architecture reviewed by a qualified engineer.
- Enclosure, power supply, thermal, EMC, creepage/clearance and overvoltage-category requirements.
- Authentication provisioning, certificate lifecycle, firmware update and recovery plan.
- Bench-test fixture and acceptance criteria.

Firmware polling is deliberately not implemented. Never treat demo values as real measurements.
