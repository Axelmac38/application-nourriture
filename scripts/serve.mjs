import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
createServer((request, response) => {
  const requestedPath = request.url.split('?')[0];
  const pathname = requestedPath === '/' ? '/index.html' : requestedPath;
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root) || !existsSync(file) || !extname(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).on('error', () => { response.writeHead(500); response.end('Unable to read file'); }).pipe(response);
}).listen(4173, () => console.log('http://localhost:4173'));
