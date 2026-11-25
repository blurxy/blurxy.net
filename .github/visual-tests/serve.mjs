import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = resolve(
  process.env.PORTFOLIO_SITE_ROOT ??
    fileURLToPath(new URL('../../', import.meta.url)),
);
const aliases = new Map([
  ['/', '/index.html'],
  ['/resume', '/resume.html'],
  ['/v1/', '/v1/index.html'],
]);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.png', 'image/png'],
  ['.pdf', 'application/pdf'],
]);

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://127.0.0.1');
  const file = resolve(site, '.' + (aliases.get(pathname) ?? pathname));
  const type = types.get(extname(file));
  if (!file.startsWith(site + sep) || !type) {
    response.writeHead(404).end();
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': type }).end(body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
}).listen(4173, '127.0.0.1');
