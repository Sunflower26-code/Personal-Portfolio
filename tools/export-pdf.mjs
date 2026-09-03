/* ============================================================
   Renders export.html to a high-quality PDF.

   Usage:
     node tools/export-pdf.mjs [output.pdf]

   Text stays as real vector text (selectable and searchable) and
   images are embedded at their full resolution, so the result
   matches the website rather than being a screenshot of it.
   ============================================================ */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = resolve(process.argv[2] || join(ROOT, 'Caitlin-Fields-Portfolio.pdf'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm'
};

/* A tiny static server. The page fetches index.html, which the
   file:// protocol will not allow. */
function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const rel = normalize(url).replace(/^(\.\.[/\\])+/, '').replace(/^\//, '');
      const file = join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      const info = await stat(file);
      const target = info.isDirectory() ? join(file, 'index.html') : file;
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res(server)));
}

const server = await serve();
const port = server.address().port;

const browser = await chromium.launch({
  args: ['--font-render-hinting=none'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
});

// deviceScaleFactor 2 keeps raster output crisp on high-DPI displays.
const context = await browser.newContext({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 2 });
const page = await context.newPage();

const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${e}`));
page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });

await page.goto(`http://127.0.0.1:${port}/export.html`, { waitUntil: 'networkidle' });

// The renderer sets this only after every image has decoded.
await page.waitForFunction(() => document.documentElement.dataset.exportReady === '1', null, { timeout: 60000 });

await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-family:Inter,Arial,sans-serif;font-size:7pt;color:#8b929c;' +
    'padding:0 15mm;display:flex;justify-content:space-between;">' +
    '<span>Caitlin Fields</span><span class="pageNumber"></span></div>',
  margin: { top: '15mm', right: '15mm', bottom: '17mm', left: '15mm' }
});

const pages = await page.evaluate(() => document.querySelectorAll('.page').length);
await browser.close();
server.close();

const { size } = await stat(OUT);
console.log(`PDF written: ${OUT}`);
console.log(`sections: ${pages}, size: ${(size / 1024 / 1024).toFixed(2)} MB`);
if (problems.length) {
  console.log('warnings:');
  for (const p of [...new Set(problems)]) console.log('  ' + p);
}
