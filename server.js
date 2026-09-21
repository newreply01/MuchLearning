/**
 * server.js - 本機 Windows 開發專用極速伺服器
 * 無需安裝任何第三方套件 (零依賴，純 Node 原生 http 實作)
 * 本機執行：node server.js
 * 即可在 http://localhost:3000 即時除錯前端與完整 Serverless API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const quizHandler = require('./api/quiz');
const searchHandler = require('./api/search');
const authHandler = require('./api/auth');
const examHandler = require('./api/exam');
const historyHandler = require('./api/history');
const collaborateHandler = require('./api/collaborate');

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

  // 處理 POST/PUT Body
  let bodyChunks = [];
  req.on('data', chunk => {
    bodyChunks.push(chunk);
  });

  req.on('end', () => {
    const rawBody = Buffer.concat(bodyChunks).toString('utf8');
    if (rawBody) {
      try {
        req.body = JSON.parse(rawBody);
      } catch (e) {
        req.body = {};
      }
    } else {
      req.body = {};
    }

    // API 路由分發
    if (pathname === '/api/quiz') {
      return quizHandler(req, res);
    }
    if (pathname === '/api/search') {
      return searchHandler(req, res);
    }
    if (pathname === '/api/auth') {
      return authHandler(req, res);
    }
    if (pathname === '/api/exam') {
      return examHandler(req, res);
    }
    if (pathname === '/api/history') {
      return historyHandler(req, res);
    }
    if (pathname === '/api/collaborate') {
      return collaborateHandler(req, res);
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
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 本機極速伺服器已就緒！`);
  console.log(`🌐 存取網址: http://localhost:${PORT}`);
  console.log(`⚡ 試卷出題: http://localhost:${PORT}/api/quiz`);
  console.log(`🏷️ 班級派卷: http://localhost:${PORT}/api/exam?code=K3-8942`);
  console.log(`👤 會員認證: http://localhost:${PORT}/api/auth?action=demo_accounts`);
  console.log(`📊 學習歷程: http://localhost:${PORT}/api/history?user_id=u-student-1`);
  console.log(`✍️ 題目協作: http://localhost:${PORT}/api/collaborate`);
  console.log(`====================================================`);
});
