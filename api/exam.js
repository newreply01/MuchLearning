/**
 * api/exam.js - 班級試卷單一識別碼 (Exam Code) 與派卷作答 API
 * 支援一鍵生成 6 位碼、全班同題作答、自動評量計分、班級排行榜與易錯題統計
 */

const { loadDatabase, saveDatabase } = require('./db');

function generateExamCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EX-${code}`;
}

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
    // GET 處理：查詢試卷 或 查詢班級成績統計報告
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const examCode = (req.query.code || '').trim().toUpperCase();
      const isReport = req.query.report === '1' || req.query.report === 'true';

      // 取得某位教師出過的所有考卷清單
      if (req.query.list === '1' && req.query.user_id) {
        const teacherExams = db.exam_papers.filter(p => p.created_by === req.query.user_id);
        return res.status(200).json({ success: true, exams: teacherExams });
      }

      if (!examCode) {
        return res.status(400).json({ success: false, error: '請提供試卷識別碼 (例如: K3-8942)' });
      }

      const paper = db.exam_papers.find(p => p.exam_code.toUpperCase() === examCode);
      if (!paper) {
        return res.status(404).json({ success: false, error: `找不到試卷代碼【${examCode}】，請確認代碼是否正確` });
      }

      // 班級統計報告 (教師端視圖)
      if (isReport) {
        const submissions = db.exam_submissions
          .filter(s => s.exam_code.toUpperCase() === examCode)
          .sort((a, b) => b.score - a.score);

        const totalSubs = submissions.length;
        const avgScore = totalSubs ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubs) : 0;
        const passSubs = submissions.filter(s => s.score >= 60).length;
        const passRate = totalSubs ? Math.round((passSubs / totalSubs) * 100) : 0;

        return res.status(200).json({
          success: true,
          exam: {
            id: paper.id,
            exam_code: paper.exam_code,
            title: paper.title,
            subtitle: paper.subtitle,
            author_name: paper.author_name,
            total_questions: paper.questions.length,
            created_at: paper.created_at
          },
          analytics: {
            total_submissions: totalSubs,
            average_score: avgScore,
            pass_rate: passRate,
            highest_score: totalSubs ? submissions[0].score : 0
          },
          leaderboard: submissions.map((s, idx) => ({
            rank: idx + 1,
            student_name: s.student_name,
            seat_number: s.seat_number,
            score: s.score,
            duration_seconds: s.duration_seconds,
            submitted_at: s.submitted_at
          }))
        });
      }

      // 學生作答端視圖 (提供試卷題目，確保全班 100% 同題)
      return res.status(200).json({
        success: true,
        exam: {
          id: paper.id,
          exam_code: paper.exam_code,
          title: paper.title,
          subtitle: paper.subtitle,
          author_name: paper.author_name,
          time_limit_minutes: paper.time_limit_minutes || 0,
          total_questions: paper.questions.length,
          questions: paper.questions
        }
      });
    }

    // -------------------------------------------------------------
    // POST 處理：創建新試卷 或 學生交卷計分
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const action = body.action || '';

      // 1. 發布班級新試卷 (教師端)
      if (action === 'create') {
        const { title, subtitle, questions, time_limit_minutes = 20, user_id = 'u-teacher-1', author_name = '教師' } = body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          return res.status(400).json({ success: false, error: '試卷必須包含至少 1 道題目' });
        }

        let newCode = generateExamCode();
        while (db.exam_papers.some(p => p.exam_code === newCode)) {
          newCode = generateExamCode();
        }

        const newPaper = {
          id: `paper-${Date.now()}`,
          exam_code: newCode,
          title: title || '國語文班級統一測驗券',
          subtitle: subtitle || '教育部課綱核心題型',
          created_by: user_id,
          author_name: author_name,
          time_limit_minutes: parseInt(time_limit_minutes, 10) || 0,
          shuffle_options: false,
          is_active: true,
          created_at: new Date().toISOString(),
          questions: questions
        };

        db.exam_papers.unshift(newPaper);
        saveDatabase(db);

        return res.status(200).json({
          success: true,
          exam_code: newCode,
          paper: newPaper,
          message: `成功發布試卷！試卷碼：${newCode}`
        });
      }

      // 2. 學生提交作答試卷 (學生/訪客端)
      if (action === 'submit') {
        const { exam_code, user_id = null, student_name, seat_number = '', user_answers = {}, duration_seconds = 0 } = body;

        if (!exam_code) {
          return res.status(400).json({ success: false, error: '請提供試卷識別碼' });
        }

        const paper = db.exam_papers.find(p => p.exam_code.toUpperCase() === exam_code.trim().toUpperCase());
        if (!paper) {
          return res.status(404).json({ success: false, error: '找不到該試卷' });
        }

        const totalQuestions = paper.questions.length;
        let correctCount = 0;
        const details = [];

        paper.questions.forEach((q, idx) => {
          const qNum = idx + 1;
          const userAns = user_answers[qNum] || user_answers[String(qNum)] || '';
          const isCorrect = (userAns.trim() === (q.correctAnswer || '').trim());

          if (isCorrect) {
            correctCount++;
          } else {
            // 自動記錄到錯題本 (若有會員 ID 則永久存入個人錯題庫)
            if (user_id) {
              const existingMistake = db.user_mistakes.find(m => m.user_id === user_id && m.promptSentence === q.promptSentence);
              if (existingMistake) {
                existingMistake.mistake_count = (existingMistake.mistake_count || 1) + 1;
                existingMistake.is_resolved = false;
                existingMistake.updated_at = new Date().toISOString();
              } else {
                db.user_mistakes.unshift({
                  id: `m-${Date.now()}-${idx}`,
                  user_id: user_id,
                  exam_code: paper.exam_code,
                  question_id: q.id || `q-${idx}`,
                  quizType: q.quizType || 'cloze',
                  promptSentence: q.promptSentence || q.example || q.word,
                  wrong_answer: userAns || '未填寫',
                  correct_answer: q.correctAnswer,
                  explanation: q.definition || q.explanation || '請參照標準字詞釋義。',
                  mistake_count: 1,
                  is_resolved: false,
                  updated_at: new Date().toISOString()
                });
              }
            }
          }

          details.push({
            question_num: qNum,
            quizType: q.quizType,
            prompt: q.promptSentence,
            user_answer: userAns,
            correct_answer: q.correctAnswer,
            is_correct: isCorrect
          });
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        // 存入交卷紀錄
        const submission = {
          id: `sub-${Date.now()}`,
          exam_code: paper.exam_code,
          user_id: user_id,
          student_name: (student_name || '無名考生').trim(),
          seat_number: (seat_number || '').trim(),
          score: score,
          total_questions: totalQuestions,
          correct_count: correctCount,
          duration_seconds: parseInt(duration_seconds, 10) || 0,
          submitted_at: new Date().toISOString(),
          answers: user_answers
        };

        db.exam_submissions.push(submission);
        saveDatabase(db);

        return res.status(200).json({
          success: true,
          score: score,
          correct_count: correctCount,
          total_questions: totalQuestions,
          submission_id: submission.id,
          details: details
        });
      }
    }

    return res.status(400).json({ success: false, error: '未支援的請求方法或操作' });
  } catch (err) {
    console.error('API /api/exam error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
