/**
 * /api/search - Vercel Serverless Function 題庫字典檢索 API
 * 全量 31,302 筆題庫伺服端高速模糊搜尋
 * 每次僅回傳分頁 24 筆 (體積僅 ~2KB)，完全消除客戶端過載問題
 */

const { searchDictionary } = require('./data-provider');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const query = req.query.q || '';
    const type = req.query.type || 'all';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 24;

    const result = searchDictionary({ query, type, page, limit });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('API /api/search Error:', err);
    res.status(500).json({
      success: false,
      error: '字典檢索失敗',
      message: err.message
    });
  }
};
