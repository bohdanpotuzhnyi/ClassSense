# ClassSense Web Server (Node)

Minimal, zero-dependency Node server that serves the student UIs and APIs for ClassSense.

## Run

```bash
# From repo root
WEB_PORT=4227 API_PORT=4228 node webserver/server.js
# If you want a single port for both web and API:
# WEB_PORT=4227 node webserver/server.js
```

Open in browser:
- Slider UI: `http://localhost:4227/slider`
- Buttons UI: `http://localhost:4227/buttons`

## Endpoints

- `POST /api/classes` -> `{ "pin": "12345" }`
- `POST /api/classes/:pin/ingest` -> upsert sensor payload for a class
- `POST /ingest` -> same as above; class pin via `class_pin` in JSON or `X-Class-Pin` header
- `GET /api/classes/:pin/state` -> latest sensors + emotions for class
- `POST /api/classes/:pin/emotions` -> store student feedback

Notes:
- Storage is in-memory (clears on restart).
- CORS is open (`*`) for quick testing.
- Static files served from `webserver/static` (root redirects randomly to `/slider` or `/buttons`).
