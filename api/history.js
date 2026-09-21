/**
 * api/history.js - 個人化學習歷程、錯題本與六維素養雷達圖 API
 */

const { loadDatabase, saveDatabase } = require('./db');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = loadDatabase();
  let body = req.body;
  if (!body && req.query) body = req.query;

  try {
    // -------------------------------------------------------------
    // GET: 取得個人學習歷程、錯題本與六維雷達指標
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const userId = req.query.user_id || 'u-student-1';
      const user = db.users.find(u => u.id === userId);

      // 1. 取得該學生的交卷紀錄
      const userSubmissions = db.exam_submissions
        .filter(s => s.user_id === userId)
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

      // 2. 取得錯題本列表
      const userMistakes = db.user_mistakes
        .filter(m => m.user_id === userId)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      // 3. 計算六維語文學力雷達圖 (0~100 分)
      // 維度：注音、錯字、成語、近義、仿寫、克漏字
      const radarScores = {
        zhuyin: 85,
        typo: 70,
        idiom: 90,
        synonym: 80,
        sentence: 88,
        cloze: 92
      };

      // 根據實本作答動態調整扣分
      userMistakes.filter(m => !m.is_resolved).forEach(m => {
        if (m.quizType === 'zhuyin') radarScores.zhuyin = Math.max(40, radarScores.zhuyin - 8);
        if (m.quizType === 'typo') radarScores.typo = Math.max(40, radarScores.typo - 10);
        if (m.quizType === 'situational' || m.quizType === 'idiom') radarScores.idiom = Math.max(40, radarScores.idiom - 7);
        if (m.quizType === 'synonym') radarScores.synonym = Math.max(40, radarScores.synonym - 8);
        if (m.quizType === 'sentence') radarScores.sentence = Math.max(40, radarScores.sentence - 6);
        if (m.quizType === 'cloze') radarScores.cloze = Math.max(40, radarScores.cloze - 5);
      });

      const avgScore = userSubmissions.length
        ? Math.round(userSubmissions.reduce((sum, s) => sum + s.score, 0) / userSubmissions.length)
        : 88;

      return res.status(200).json({
        success: true,
        user: user ? { id: user.id, real_name: user.real_name, role: user.role, grade_class: user.grade_class } : null,
        stats: {
          total_exams: userSubmissions.length,
          average_score: avgScore,
          unresolved_mistakes: userMistakes.filter(m => !m.is_resolved).length,
          resolved_mistakes: userMistakes.filter(m => m.is_resolved).length
        },
        radar: [
          { dimension: '國字注音辨別力', key: 'zhuyin', score: radarScores.zhuyin },
          { dimension: '形音義錯字辨析力', key: 'typo', score: radarScores.typo },
          { dimension: '成語生活情境素養', key: 'idiom', score: radarScores.idiom },
          { dimension: '詞義近義替換力', key: 'synonym', score: radarScores.synonym },
          { dimension: '短語造句仿寫力', key: 'sentence', score: radarScores.sentence },
          { dimension: '文意克漏字理解力', key: 'cloze', score: radarScores.cloze }
        ],
        submissions: userSubmissions,
        mistakes: userMistakes
      });
    }

    // -------------------------------------------------------------
    // POST: 標記錯題已克服 (重測過關) 或 刪除錯題
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const { action, mistake_id } = body;

      if (action === 'resolve_mistake' && mistake_id) {
        const mistake = db.user_mistakes.find(m => m.id === mistake_id);
        if (mistake) {
          mistake.is_resolved = true;
          mistake.resolved_at = new Date().toISOString();
          saveDatabase(db);
          return res.status(200).json({ success: true, message: '🎉 太棒了！該題已成功克服！' });
        }
        return res.status(404).json({ success: false, error: '找不到該錯題紀錄' });
      }

      if (action === 'delete_mistake' && mistake_id) {
        db.user_mistakes = db.user_mistakes.filter(m => m.id !== mistake_id);
        saveDatabase(db);
        return res.status(200).json({ success: true, message: '錯題已移除' });
      }
    }

    return res.status(400).json({ success: false, error: '未支援的請求操作' });
  } catch (err) {
    console.error('API /api/history error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
