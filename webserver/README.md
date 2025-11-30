# ClassSense Web Server (Node)

Minimal Node server for the student UIs and APIs for ClassSense. Works in-memory by default; enable PostgreSQL for persistence.

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
- Storage is in-memory unless you configure PostgreSQL (see below).
- CORS is open (`*`) for quick testing.
- Static files served from `webserver/static` (root redirects randomly to `/slider` or `/buttons`).

## PostgreSQL (optional, recommended)

When `PG_CONNECTION_STRING` or `DATABASE_URL` is set, the server persists classes, last sensor payload, and emotions in Postgres. If the variable is absent it falls back to in-memory storage.

Env vars:
- `PG_CONNECTION_STRING` (or `DATABASE_URL`): e.g. `postgres://classsense_app:classsense-pass@localhost:5432/classsense`
- `PG_SSL`: set to `true` to allow SSL with `rejectUnauthorized: false`, or `false` to disable SSL (default: unset, uses driver default)
- `EMOTION_LIMIT`: max number of emotion rows returned (defaults to `10000`)
- Store the connection string as an environment variable at runtime (systemd env file, shell export, etc.)—do not hardcode it in code.

### Prepare the database

Requirements: `psql` available and a superuser (e.g., `postgres`) that can create roles/databases.

1) Create DB, user (restricted to these tables), and tables:
```bash
cd webserver/db
DB_PASS="strong-pass-here" ./setup.sh  # Optional; if omitted a random password is generated and printed.
# Optional overrides:
# DB_NAME=classsense DB_USER=classsense_app DB_HOST=localhost DB_PORT=5432 SUPERUSER=postgres ./setup.sh
# If running as root, the script will use sudo -u $SUPERUSER for psql by default (set USE_SUDO=0 to disable).
# If password auth is required, export SUPERUSER_PASS to avoid prompts; otherwise peer/local auth should work and the script switches to a unix socket when using sudo.
```

The script:
- Creates role `classsense_app` (or `DB_USER`) with login
- Creates database `classsense` (or `DB_NAME`)
- Creates tables from `schema.sql`
- Grants the user access only to those tables/sequences

2) Configure the server to use the new database:
```bash
# Install the only dependency needed for Postgres mode
npm install pg

# Using TCP
export PG_CONNECTION_STRING="postgres://classsense_app:<password>@localhost:5432/classsense"
# Or using local socket (host omitted)
# export PG_CONNECTION_STRING="postgres://classsense_app:<password>@:5432/classsense"
# export PG_HOST="/var/run/postgresql"  # optional, default when host is omitted
WEB_PORT=4227 API_PORT=4228 node webserver/server.js
```

Schema reference: `webserver/db/schema.sql` (tables `classes` and `emotions` with a FK on `pin`).
