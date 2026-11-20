// Neon Coast Cover Studio — static file server (entrypoint).
//
// Serves the app/ folder over HTTP so the cover studio can be opened in a
// browser with no build step and no runtime network access. Node stdlib only.
//
//   node main.ts            # serves on http://localhost:8080
//   PORT=3000 node main.ts  # pick another port
//
// Layout notes:
// - "/" and any extension-less path fall back to app/index.html, so the
//   single-page editor loads from any route.
// - Paths with a file extension that do not exist answer 404 instead of the
//   fallback page, so a missing script or image never masquerades as HTML.
// - Requests are confined to app/; ".." escapes are rejected outright.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const APP_ROOT = resolve(HERE, "app");

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT: ${process.env.PORT ?? "8080"}`);
  process.exit(1);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function contentTypeFor(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function cacheControlFor(filePath) {
  // Pages are always fresh; hashed assets are not used, so keep assets short-lived too.
  return extname(filePath).toLowerCase() === ".html"
    ? "no-cache"
    : "public, max-age=3600";
}

// Resolve a URL path to a file inside APP_ROOT, or null when it escapes.
function resolveInsideRoot(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const target = resolve(APP_ROOT, `.${decoded}`);
  if (target !== APP_ROOT && !target.startsWith(APP_ROOT + sep)) {
    return null;
  }
  return target;
}

async function serveFile(res, filePath, method) {
  const body = await readFile(filePath);
  res.writeHead(200, {
    "content-type": contentTypeFor(filePath),
    "content-length": body.length,
    "cache-control": cacheControlFor(filePath),
  });
  if (method === "GET") {
    res.end(body);
  } else {
    res.end();
  }
  return 200;
}

function sendError(res, status, message) {
  const body = `${status} ${message}\n`;
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
  return status;
}

const server = createServer(async (req, res) => {
  const startedAt = Date.now();
  let status = 500;
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const method = req.method ?? "GET";

    if (method !== "GET" && method !== "HEAD") {
      status = sendError(res, 405, "Method Not Allowed");
      return;
    }

    if (url.pathname === "/healthz") {
      const body = JSON.stringify({ status: "ok", app: "neon-coast-cover-studio" });
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "content-length": Buffer.byteLength(body),
        "cache-control": "no-store",
      });
      res.end(method === "GET" ? body : "");
      status = 200;
      return;
    }

    let filePath = resolveInsideRoot(url.pathname);
    if (filePath === null) {
      status = sendError(res, 403, "Forbidden");
      return;
    }

    let info = null;
    try {
      info = await stat(filePath);
    } catch {
      info = null;
    }

    if (info?.isDirectory()) {
      filePath = join(filePath, "index.html");
      try {
        info = await stat(filePath);
      } catch {
        info = null;
      }
    }

    if (info === null || !info.isFile()) {
      // Extension-less routes fall back to the editor; real asset paths 404.
      if (extname(url.pathname) === "") {
        status = await serveFile(res, join(APP_ROOT, "index.html"), method);
        return;
      }
      status = sendError(res, 404, "Not Found");
      return;
    }

    status = await serveFile(res, filePath, method);
  } catch (error) {
    if (!res.headersSent) {
      status = sendError(res, 500, "Internal Server Error");
    } else {
      status = 500;
    }
    console.error("request failed:", error);
  } finally {
    const ms = Date.now() - startedAt;
    console.log(`${req.method} ${req.url} -> ${status} (${ms}ms)`);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT to another value.`);
  } else {
    console.error("server error:", error);
  }
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Neon Coast Cover Studio serving ${APP_ROOT}`);
  console.log(`Open http://localhost:${PORT} in a browser (Ctrl+C to stop)`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down…`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
