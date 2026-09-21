/**
 * /api/quiz - Vercel Serverless Function 出題 API
 * 支援全題型、各版本教科書課次篩選、年級成語抽題
 * 每次僅回傳 10~25 題精簡 JSON (體積僅 ~3KB)，極致抗高並發
 */

const { getQuestions } = require('./data-provider');

module.exports = (req, res) => {
  // 支援 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const params = req.query || {};
    const questions = getQuestions(params);

    // 設定 Vercel 邊緣快取標頭 (短快取，避免重複高頻點擊)
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (err) {
    console.error('API /api/quiz Error:', err);
    res.status(500).json({
      success: false,
      error: '伺服端組卷失敗',
      message: err.message
    });
  }
};
