// Serves public/ on http://localhost:4173 for local previews.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".csv": "text/csv; charset=utf-8", ".sql": "text/plain; charset=utf-8", ".geojson": "application/geo+json" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let file = path.join(dir, decodeURIComponent(url.pathname));
  if (!file.startsWith(dir)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) return res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(4173, () => console.log("http://localhost:4173"));
