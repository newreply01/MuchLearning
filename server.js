/**
 * server.js - 本機 Windows 開發專用極速伺服器
 * 無需安裝任何第三方套件 (零依賴，純 Node 原生 http 實作)
 * 本機執行：node server.js
 * 即可在 http://localhost:3000 即時除錯前端與 Serverless API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const quizHandler = require('./api/quiz');
const searchHandler = require('./api/search');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 模擬 Express res 物件的 .status() 與 .json()
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  req.query = parsedUrl.query;

  // API 路由分發
  if (pathname === '/api/quiz') {
    return quizHandler(req, res);
  }

  if (pathname === '/api/search') {
    return searchHandler(req, res);
  }

  // 靜態檔案分發
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found: ' + pathname);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 本機極速伺服器已就緒！`);
  console.log(`🌐 存取網址: http://localhost:${PORT}`);
  console.log(`⚡ API 端點: http://localhost:${PORT}/api/quiz`);
  console.log(`🔍 搜尋端點: http://localhost:${PORT}/api/search?q=守株待兔`);
  console.log(`====================================================`);
});
