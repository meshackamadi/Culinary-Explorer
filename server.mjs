import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname);
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
};

function resolvePath(urlPath) {
  const normalized = urlPath === '/' ? '/index.html' : urlPath;
  const requestedPath = resolve(rootDir, `.${normalized}`);

  if (!requestedPath.startsWith(rootDir)) {
    return null;
  }

  return requestedPath;
}

createServer((request, response) => {
  const path = resolvePath(request.url ?? '/');
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = extname(path);
  const contentType = contentTypes[extension] ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType });
  createReadStream(path).pipe(response);
}).listen(port, () => {
  console.log(`Culinary Explorer running at http://localhost:${port}`);
});
