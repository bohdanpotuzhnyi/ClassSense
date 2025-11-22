<!--
Purpose: concise, actionable instructions for an AI coding agent working on ClassSense.
Keep this file short (20-50 lines) and reference concrete files/commands from the repo.
-->
# GitHub Copilot instructions — ClassSense

Quick summary
- ClassSense is a small demo system with two main parts: an enviro client that runs on a Raspberry Pi (`rpi-files/sensor_client.py`) and a minimal Node web server that serves static UIs and accepts sensor ingest (`webserver/server.js`).

Essential architecture
- rpi client: reads sensors (LTR559, BME280, SGP30, microphone), displays values on a small LCD and POSTs JSON to a server configured via `rpi-files/config.ini`.
- web server: zero-dependency Node server (`webserver/server.js`) with in-memory storage for classes and endpoints under `/api/*` and `/ingest`. Static UI files live in `webserver/static`.

Key files to reference
- `rpi-files/sensor_client.py` — sensor init, compensation, LCD rendering, HTTP POST helper `post_json()` and the main loop.
- `rpi-files/config.ini` & `rpi-files/requirements.txt` — config keys (`server.url`, `server.api_key`, `sampling.period_seconds`) and required packages.
- `rpi-files/README.md` — deployment notes for the Pi (venv, systemd service example, payload schema).
- `webserver/server.js` — how the API works (endpoints, ports, in-memory store, CORS note).

Developer workflows & commands
- Run the webserver locally: from repo root
  WEB_PORT=4227 API_PORT=4228 node webserver/server.js
- Run the Pi client manually (on Pi): create venv, install `rpi-files/requirements.txt`, then:
  python3 rpi-files/sensor_client.py
- Service example: `rpi-files/enviro_web_client.service` is referenced in the Pi README for systemd usage.

Project-specific conventions & gotchas
- Sensor libs are optional at runtime: `sensor_client.py` catches import failures and runs with `None` sensors (returns `nan` or `None`). Tests or changes should account for absent hardware by mocking or checking for `None`.
- The client uses `Authorization: Bearer <api_key>` when `api_key` is set in `config.ini` and falls back to `X-Class-Pin` or `class_pin` JSON if the legacy flow is used (the alternate `api_base`/`class_pin` flow is present but commented-out in code).
- Server storage is ephemeral (in-memory). Any change that relies on persistence should add a storage layer or clearly note data loss on restart.
- The codebase intentionally keeps dependencies minimal for the server (no npm deps). Keep edits minimal and prefer small, well-contained changes.

Examples to copy into patches or tests
- Ingest payload (from `rpi-files/README.md`):
  { "device_id":"raspi-lab-01","timestamp":"...","sensors":{"brightness_lux":153.7,"eco2_ppm":612,"temperature_c":22.6,"noise_db":34.5},"meta":{"app":"enviro_client","version":"1.2.0"} }
- API endpoints to target in tests: `POST /ingest`, `POST /api/classes`, `POST /api/classes/:pin/ingest`, `GET /api/classes/:pin/state`.

When editing
- Preserve the light-weight design of the server unless there is a clear requirement to add dependencies.
- When touching `sensor_client.py`, add unit-level mocks for sensors (simulate `LTR559`, `BME280`, `SGP30` and `sounddevice`) and ensure code handles `nan`/`None` cleanly.

If something's unclear
- Ask for the target platform (local dev or Pi), and whether persistence is acceptable. If adding persistence, propose a short migration (file-based JSON or sqlite).

— End of file
