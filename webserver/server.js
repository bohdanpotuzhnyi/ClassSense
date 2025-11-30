#!/usr/bin/env node
/**
 * ClassSense Node web server (Postgres optional via `pg`).
 *
 * - Serves static UI at /slider and /buttons (randomly chosen on /).
 * - API:
 *   POST /api/classes -> {pin}
 *   POST /api/classes/:pin/ingest OR POST /ingest (JSON with class_pin)
 *   GET  /api/classes/:pin/state
 *   POST /api/classes/:pin/emotions
 *
 * Default ports:
 * - Web/UI: 4227 (WEB_PORT env overrides)
 * - (Optional) API_PORT env to start a second listener just for API on 4228.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const WEB_PORT = Number(process.env.WEB_PORT || 4227);
const API_PORT = process.env.API_PORT ? Number(process.env.API_PORT) : null;
const DB_URL = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL || null;
const DB_SSL =
  process.env.PG_SSL === "true"
    ? { rejectUnauthorized: false }
    : process.env.PG_SSL === "false"
    ? false
    : undefined;

const ROOT = __dirname;
const STATIC_ROOT = path.join(ROOT, "static");

// In-memory store
const memStore = {
  classes: {},
};

const EMOTION_LIMIT = Number.isFinite(Number(process.env.EMOTION_LIMIT))
  ? Number(process.env.EMOTION_LIMIT)
  : 10000;

const utcNow = () => new Date().toISOString();

function generatePin() {
  return Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
}

function createMemoryStore() {
  const classes = memStore.classes;
  return {
    async createClass(metadata = {}) {
      let pin;
      let tries = 0;
      do {
        pin = generatePin();
        tries += 1;
        if (tries > 1000) throw new Error("pin_generation_failed");
      } while (classes[pin]);
      classes[pin] = {
        created_at: utcNow(),
        metadata,
        last_sensor: null,
        last_sensor_at: null,
        emotions: [],
      };
      return pin;
    },
    async upsertSensor(pin, payload) {
      const cls = classes[pin];
      if (!cls) throw new Error("class_not_found");
      cls.last_sensor = payload;
      cls.last_sensor_at = utcNow();
    },
    async addEmotion(pin, payload) {
      const cls = classes[pin];
      if (!cls) throw new Error("class_not_found");
      cls.emotions.push({ received_at: utcNow(), payload });
      cls.emotions = cls.emotions.slice(-EMOTION_LIMIT);
    },
    async getState(pin) {
      const cls = classes[pin];
      if (!cls) throw new Error("class_not_found");
      return {
        pin,
        created_at: cls.created_at,
        metadata: cls.metadata,
        last_sensor: cls.last_sensor,
        last_sensor_at: cls.last_sensor_at,
        emotions: cls.emotions,
      };
    },
  };
}

function createPgStore(pool) {
  const uniquePin = async () => {
    let tries = 0;
    while (tries < 5000) {
      const pin = generatePin();
      tries += 1;
      try {
        await pool.query("INSERT INTO classes (pin, metadata) VALUES ($1, $2)", [pin, {}]);
        return pin;
      } catch (e) {
        // 23505 -> unique violation
        if (e && e.code === "23505") continue;
        throw e;
      }
    }
    throw new Error("pin_generation_failed");
  };

  const ensureClass = async (pin) => {
    const { rows } = await pool.query("SELECT pin FROM classes WHERE pin = $1", [pin]);
    if (!rows.length) throw new Error("class_not_found");
  };

  return {
    async createClass(metadata = {}) {
      // First try generating/inserting with empty metadata, then update with actual data
      const pin = await uniquePin();
      await pool.query("UPDATE classes SET metadata = $1 WHERE pin = $2", [metadata, pin]);
      return pin;
    },
    async upsertSensor(pin, payload) {
      const res = await pool.query(
        "UPDATE classes SET last_sensor = $1, last_sensor_at = NOW() WHERE pin = $2",
        [payload, pin]
      );
      if (res.rowCount === 0) throw new Error("class_not_found");
    },
    async addEmotion(pin, payload) {
      try {
        await pool.query("INSERT INTO emotions (pin, payload) VALUES ($1, $2)", [pin, payload]);
      } catch (e) {
        if (e && e.code === "23503") throw new Error("class_not_found");
        throw e;
      }
    },
    async getState(pin) {
      const { rows } = await pool.query(
        "SELECT pin, created_at, metadata, last_sensor, last_sensor_at FROM classes WHERE pin = $1",
        [pin]
      );
      if (!rows.length) throw new Error("class_not_found");
      const cls = rows[0];
      const emo = await pool.query(
        "SELECT received_at, payload FROM emotions WHERE pin = $1 ORDER BY received_at ASC LIMIT $2",
        [pin, EMOTION_LIMIT]
      );
      return {
        pin: cls.pin,
        created_at: cls.created_at,
        metadata: cls.metadata,
        last_sensor: cls.last_sensor,
        last_sensor_at: cls.last_sensor_at,
        emotions: emo.rows,
      };
    },
  };
}

let dataStore = null;
if (DB_URL) {
  try {
    const { Pool } = require("pg");
    const parsed = new URL(DB_URL);
    const poolCfg = { connectionString: DB_URL, ssl: DB_SSL };
    if (!parsed.hostname) {
      // Allow socket-based connections when host is omitted in URL (e.g., postgres://user:pass@:5432/db)
      poolCfg.host = process.env.PG_HOST || "/var/run/postgresql";
    }
    const pool = new Pool(poolCfg);
    pool.on("error", (err) => console.error("Postgres pool error", err));
    dataStore = createPgStore(pool);
    console.log("Using PostgreSQL store");
  } catch (e) {
    console.warn("Failed to init Postgres store, falling back to memory:", e.message);
    dataStore = createMemoryStore();
  }
} else {
  dataStore = createMemoryStore();
}

// Helpers
function sendJson(res, code, payload) {
  const data = Buffer.from(JSON.stringify(payload));
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": data.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Class-Pin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(data);
}

function serveStatic(req, res, pathname) {
  if (pathname === "/") {
    const target = Math.random() > 0.5 ? "/slider" : "/buttons";
    res.writeHead(302, { Location: target });
    res.end();
    return;
  }

  let mapped = pathname;
  if (pathname === "/slider" || pathname === "/slider/") mapped = "/index.html";
  if (pathname === "/buttons" || pathname === "/buttons/") mapped = "/buttons.html";
  if (pathname === "/api-suite" || pathname === "/api-suite/") mapped = "/api-suite.html";
  if (pathname === "/teacher" || pathname === "/teacher/") mapped = "/teacher.html";
  if (pathname === "/teacher-display" || pathname === "/teacher-display/") mapped = "/teacher-display.html";

  const safePath = path.normalize(path.join(STATIC_ROOT, mapped.replace(/^\//, "")));
  if (!safePath.startsWith(STATIC_ROOT)) {
    sendJson(res, 404, { error: "not_found" });
    return;
  }
  let filePath = safePath;

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(res, 404, { error: "not_found" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime =
    {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    }[ext] || "application/octet-stream";

  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": data.length,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(data);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let buf = [];
    req
      .on("data", (chunk) => buf.push(chunk))
      .on("end", () => {
        const raw = Buffer.concat(buf).toString("utf-8");
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve({ _error: "invalid_json" });
        }
      })
      .on("error", () => resolve({}));
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return true;
  }

  // POST /api/classes
  if (req.method === "POST" && pathname === "/api/classes") {
    const body = await parseBody(req);
    if (body._error) return sendJson(res, 400, { error: body._error });
    try {
      const pin = await dataStore.createClass(body || {});
      sendJson(res, 201, { pin });
    } catch (e) {
      sendJson(res, 500, { error: "failed_to_create_class" });
    }
    return true;
  }

  // POST /ingest
  if (req.method === "POST" && pathname === "/ingest") {
    const body = await parseBody(req);
    if (body._error) return sendJson(res, 400, { error: body._error });
    const pin = req.headers["x-class-pin"] || body.class_pin;
    if (!pin) return sendJson(res, 400, { error: "missing_class_pin" });
    try {
      await dataStore.upsertSensor(pin, body);
      sendJson(res, 200, { status: "ingest_ok" });
    } catch (e) {
      sendJson(res, 404, { error: "class_not_found" });
    }
    return true;
  }

  // Regex helpers
  const ingestMatch = pathname.match(/^\/api\/classes\/(\d{5})\/ingest$/);
  if (req.method === "POST" && ingestMatch) {
    const pin = ingestMatch[1];
    const body = await parseBody(req);
    if (body._error) return sendJson(res, 400, { error: body._error });
    try {
      await dataStore.upsertSensor(pin, body);
      sendJson(res, 200, { status: "ingest_ok" });
    } catch (e) {
      sendJson(res, 404, { error: "class_not_found" });
    }
    return true;
  }

  const stateMatch = pathname.match(/^\/api\/classes\/(\d{5})\/state$/);
  if (req.method === "GET" && stateMatch) {
    try {
      const state = await dataStore.getState(stateMatch[1]);
      sendJson(res, 200, state);
    } catch (e) {
      sendJson(res, 404, { error: "class_not_found" });
    }
    return true;
  }

  const emotionsMatch = pathname.match(/^\/api\/classes\/(\d{5})\/emotions$/);
  if (req.method === "POST" && emotionsMatch) {
    const body = await parseBody(req);
    if (body._error) return sendJson(res, 400, { error: body._error });
    try {
      await dataStore.addEmotion(emotionsMatch[1], body);
      sendJson(res, 200, { status: "recorded" });
    } catch (e) {
      sendJson(res, 404, { error: "class_not_found" });
    }
    return true;
  }

  return false;
}

function requestHandler(req, res) {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname || "/";

  console.log(`[${utcNow()}] ${req.method} ${pathname}`);

  handleApi(req, res, pathname).then((handled) => {
    if (handled) return;
    serveStatic(req, res, pathname);
  });
}

function startServer(port, label) {
  const srv = http.createServer(requestHandler);
  srv.listen(port, () => {
    console.log(`${label} listening on http://localhost:${port}`);
  });
}

// Start servers
startServer(WEB_PORT, "Web/API server");
if (API_PORT && API_PORT !== WEB_PORT) {
  startServer(API_PORT, "API-only server");
}
