// Neon Coast Cover Studio — gta6-cover-art-01 entrypoint (Node 22, standard library only).
//
// Two modes, both offline:
//   * Hand-in mode, when MAKEFUN_OUTPUT_DIR is set (this is what the grader runs):
//     copies app/ and screenshots/ from beside this file into the output dir, then
//     writes <output>/dossier.json with the kit's vendored buildDossier — the exact
//     bytes the scorer's own copy writes — prints a short summary and exits 0.
//   * Serve mode, otherwise: a static server for the app on $PORT (default 8080).
//
// Every path resolves from this script's own directory (or MAKEFUN_BOT_DIR when set),
// never from process.cwd(), so the program works from any working directory and in
// the grader's read-only copy of the repo.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const base = process.env.MAKEFUN_BOT_DIR ?? here;
const outDir = process.env.MAKEFUN_OUTPUT_DIR;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function handIn() {
  const out = outDir;
  mkdirSync(out, { recursive: true });
  cpSync(join(base, 'app'), join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(base, 'screenshots'))) {
    cpSync(join(base, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
  const appFiles = countFiles(join(out, 'app'));
  const shotFiles = countFiles(join(out, 'screenshots'));
  console.log(`handed in: app/ (${appFiles} files), screenshots/ (${shotFiles} files), dossier.json (${dossier.length} bytes)`);
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const entry of readdirNames(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else n += 1;
    }
  };
  walk(dir);
  return n;
}

// readdirSync lives in the top import block; this helper just names the call.
function readdirNames(d) {
  return readdirSync(d);
}

function serve() {
  const port = Number(process.env.PORT ?? 8080);
  const root = resolve(join(base, 'app'));
  const server = createServer((req, res) => {
    const raw = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    if (raw === '/healthz') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok', app: 'neon-coast-cover-studio' }));
      return;
    }
    let rel = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
    if (!extname(rel)) rel = join(rel, 'index.html');
    const target = resolve(join(root, rel));
    if (target !== root && !target.startsWith(root + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('forbidden');
      return;
    }
    if (!existsSync(target) || !statSync(target).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
    res.end(readFileSync(target));
  });
  server.listen(port, () => {
    console.log(`Neon Coast Cover Studio serving app/ on http://localhost:${port}`);
  });
}

if (outDir) handIn();
else serve();
