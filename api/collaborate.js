/**
 * api/collaborate.js - 教師線上多人協作成題目與審核工作流 API
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
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  if (!body && req.query) body = req.query;
  body = body || {};

  try {
    // -------------------------------------------------------------
    // GET: 取得協作題目列表 (可按狀態 filter: pending, approved, all)
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const statusFilter = req.query.status || 'all';
      let list = db.custom_questions || [];

      if (statusFilter !== 'all') {
        list = list.filter(q => q.status === statusFilter);
      }

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return res.status(200).json({
        success: true,
        total: list.length,
        stats: {
          total: db.custom_questions.length,
          pending: db.custom_questions.filter(q => q.status === 'pending').length,
          approved: db.custom_questions.filter(q => q.status === 'approved').length,
          rejected: db.custom_questions.filter(q => q.status === 'rejected').length
        },
        questions: list
      });
    }

    // -------------------------------------------------------------
    // POST: 提交新題目 或 審核現有題目
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const action = body.action || '';

      // 1. 教師提交新題目
      if (action === 'create') {
        const {
          created_by = 'u-teacher-1',
          author_name = '王大成 老師',
          quiz_type = 'cloze',
          press = 'kangxuan',
          grade = 3,
          semester = 1,
          lesson_num = 1,
          prompt,
          options,
          correct_answer,
          explanation = ''
        } = body;

        if (!prompt || !correct_answer) {
          return res.status(400).json({ success: false, error: '請完整填寫題幹與正確答案' });
        }

        const newQuestion = {
          id: `cq-${Date.now()}`,
          created_by,
          author_name,
          quiz_type,
          press,
          grade: parseInt(grade, 10) || 3,
          semester: parseInt(semester, 10) || 1,
          lesson_num: parseInt(lesson_num, 10) || 1,
          prompt: prompt.trim(),
          options_json: JSON.stringify(Array.isArray(options) ? options : [correct_answer, '干擾項A', '干擾項B', '干擾項C']),
          correct_answer: correct_answer.trim(),
          explanation: explanation.trim(),
          status: 'pending',
          reviewed_by: null,
          created_at: new Date().toISOString()
        };

        db.custom_questions.unshift(newQuestion);
        saveDatabase(db);

        return res.status(200).json({
          success: true,
          message: '題目已成功提交審核！',
          question: newQuestion
        });
      }

      // 2. 審核題目 (批准/退回)
      if (action === 'review') {
        const { question_id, decision, reviewer_name = '審核組長' } = body;

        if (!question_id || !decision) {
          return res.status(400).json({ success: false, error: '請提供題目識別碼與審核決策' });
        }

        const target = db.custom_questions.find(q => q.id === question_id);
        if (!target) {
          return res.status(404).json({ success: false, error: '找不到該協作題目' });
        }

        target.status = decision === 'approve' ? 'approved' : 'rejected';
        target.reviewed_by = reviewer_name;
        target.reviewed_at = new Date().toISOString();

        saveDatabase(db);

        return res.status(200).json({
          success: true,
          message: decision === 'approve' ? '✅ 題目已審核通過並永久發布！' : '❌ 題目已退回修正。',
          question: target
        });
      }
    }

    return res.status(400).json({ success: false, error: '未支援的操作' });
  } catch (err) {
    console.error('API /api/collaborate error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
