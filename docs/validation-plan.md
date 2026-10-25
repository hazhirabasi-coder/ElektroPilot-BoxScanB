# Validation plan

## Phase 0 — requirements
- [ ] Specify user, intended use, exclusions, and failure consequences.
- [ ] Select meter/interface and obtain official protocol documentation.
- [ ] Define data dictionary and acceptance criteria.

## Phase 1 — software
- [ ] Unit and integration tests for API validation.
- [ ] Negative tests for malformed, stale, missing and implausible data.
- [ ] Authentication/authorization and rate-limit tests before external deployment.
- [ ] Verify that UI labels demo data and uncertainty clearly.

## Phase 2 — safe bench
- [ ] Review hardware design with qualified engineer.
- [ ] Use safe low-voltage simulator / meter interface first.
- [ ] Compare captured values against a calibrated reference.
- [ ] Verify error states, disconnects, wrong register maps and timestamp drift.

## Phase 3 — expert validation
- [ ] Build a blinded, expert-reviewed case set.
- [ ] Measure false reassurance, missed risks, unsupported conclusions and usefulness.
- [ ] Block release if it ever implies safety certification from incomplete data.
- [ ] Obtain independent safety and security review before field trials.
