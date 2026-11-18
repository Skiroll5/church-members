/**
 * server.js - Lightweight zero-dependency HTTP server with direct JSON save API
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3001;
const BASE_DIR = __dirname;
const DATA_FILE = path.join(BASE_DIR, 'church_data.json');
const LEGACY_FILE = path.join(BASE_DIR, 'church_members.json');
const BACKUP_DIR = path.join(BASE_DIR, 'backups');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Data API: the whole database (members, groups, sessions) as one JSON document
  if (req.url === '/api/data' && req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (fs.existsSync(DATA_FILE)) {
        res.writeHead(200);
        res.end(fs.readFileSync(DATA_FILE, 'utf8'));
      } else if (fs.existsSync(LEGACY_FILE)) {
        // First run after the redesign: hand the old members list to the app for migration
        res.writeHead(200);
        res.end(JSON.stringify({ legacyMembers: JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8')) }));
      } else {
        res.writeHead(200);
        res.end('{}');
      }
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.url === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.groups) || !Array.isArray(parsed.sessions)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Expected { members, groups, sessions }' }));
          return;
        }
        // One backup per day, kept in ./backups (kept out of git)
        try {
          if (fs.existsSync(DATA_FILE)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            const day = new Date().toISOString().slice(0, 10);
            const bk = path.join(BACKUP_DIR, `church_data_${day}.json`);
            if (!fs.existsSync(bk)) fs.copyFileSync(DATA_FILE, bk);
          }
        } catch (e) { console.warn('Could not create backup:', e.message); }

        // Write atomically so a crash never leaves a half-written file
        const tmp = DATA_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2), 'utf8');
        fs.renameSync(tmp, DATA_FILE);
        console.log(`[${new Date().toLocaleTimeString()}] Saved ${parsed.members.length} members, ${parsed.sessions.length} sessions`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Error saving JSON:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Never serve the private data files as static files
  const blocked = /\/(church_data|church_members)[^/]*\.json$|^\/backups\//i;
  if (blocked.test(decodeURI(req.url.split('?')[0]))) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Static file serving
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(BASE_DIR, reqPath);

  // Security check: ensure path is within BASE_DIR
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File not found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`San Athanasius Church Members App running at http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
