#!/usr/bin/env node
/**
 * ClassSense Node web server (no external deps).
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

const ROOT = __dirname;
const STATIC_ROOT = path.join(ROOT, "static");

// In-memory store
const store = {
  classes: {},
};

const utcNow = () => new Date().toISOString();

function generatePin() {
  let pin;
  do {
    pin = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
  } while (store.classes[pin]);
  return pin;
}

function createClass(metadata = {}) {
  const pin = generatePin();
  store.classes[pin] = {
    created_at: utcNow(),
    metadata,
    last_sensor: null,
    last_sensor_at: null,
    emotions: [],
  };
  return pin;
}

function upsertSensor(pin, payload) {
  const cls = store.classes[pin];
  if (!cls) throw new Error("class_not_found");
  cls.last_sensor = payload;
  cls.last_sensor_at = utcNow();
}

function addEmotion(pin, payload) {
  const cls = store.classes[pin];
  if (!cls) throw new Error("class_not_found");
  cls.emotions.push({ received_at: utcNow(), payload });
  cls.emotions = cls.emotions.slice(-200);
}

function getState(pin) {
  const cls = store.classes[pin];
  if (!cls) throw new Error("class_not_found");
  return {
    pin,
    created_at: cls.created_at,
    metadata: cls.metadata,
    last_sensor: cls.last_sensor,
    last_sensor_at: cls.last_sensor_at,
    emotions: cls.emotions,
  };
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
    const pin = createClass(body || {});
    sendJson(res, 201, { pin });
    return true;
  }

  // POST /ingest
  if (req.method === "POST" && pathname === "/ingest") {
    const body = await parseBody(req);
    if (body._error) return sendJson(res, 400, { error: body._error });
    const pin = req.headers["x-class-pin"] || body.class_pin;
    if (!pin) return sendJson(res, 400, { error: "missing_class_pin" });
    try {
      upsertSensor(pin, body);
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
      upsertSensor(pin, body);
      sendJson(res, 200, { status: "ingest_ok" });
    } catch (e) {
      sendJson(res, 404, { error: "class_not_found" });
    }
    return true;
  }

  const stateMatch = pathname.match(/^\/api\/classes\/(\d{5})\/state$/);
  if (req.method === "GET" && stateMatch) {
    try {
      const state = getState(stateMatch[1]);
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
      addEmotion(emotionsMatch[1], body);
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
