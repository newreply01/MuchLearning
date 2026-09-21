/**
 * api/auth.js - 會員帳號驗證與管理 API
 * 支援角色：學生 (student)、教師 (teacher)、家長 (parent)
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

  // 取得請求主體 (兼容 serverless 與本機原生 Node)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  if (!body && req.query) body = req.query;
  body = body || {};

  const db = loadDatabase();
  const action = (body && body.action) || (req.query && req.query.action) || '';

  try {
    // 1. 登入
    if (action === 'login' || (req.method === 'POST' && body.username && body.password && !body.real_name)) {
      const { username, password } = body;
      const user = db.users.find(u => u.username === username.trim());

      if (!user || user.password !== password) {
        return res.status(401).json({
          success: false,
          error: '帳號或密碼錯誤'
        });
      }

      // 遮蔽密碼並回傳
      const { password: _, ...userSafe } = user;
      return res.status(200).json({
        success: true,
        user: userSafe,
        token: `token_${user.id}_${Date.now()}`
      });
    }

    // 2. 註冊
    if (action === 'register' || (req.method === 'POST' && body.username && body.password && body.real_name)) {
      const { username, password, real_name, role = 'student', school_name = '', grade_class = '', seat_number = '' } = body;

      if (!username || !password || !real_name) {
        return res.status(400).json({ success: false, error: '請完整填寫帳號、密碼與姓名' });
      }

      if (db.users.some(u => u.username === username.trim())) {
        return res.status(400).json({ success: false, error: '此帳號已被註冊，請換一個使用者名稱' });
      }

      const newUser = {
        id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: username.trim(),
        password: password,
        real_name: real_name.trim(),
        role: role,
        school_name: school_name.trim() || '自學 / 國小',
        grade_class: grade_class.trim() || '三年級',
        seat_number: seat_number.trim(),
        created_at: new Date().toISOString()
      };

      db.users.push(newUser);
      saveDatabase(db);

      const { password: _, ...userSafe } = newUser;
      return res.status(200).json({
        success: true,
        user: userSafe,
        token: `token_${newUser.id}_${Date.now()}`
      });
    }

    // 3. 取得目前使用者狀態或種子展示清單
    if (action === 'demo_accounts') {
      const safeDemo = db.users.map(u => ({
        id: u.id,
        username: u.username,
        real_name: u.real_name,
        role: u.role,
        school_name: u.school_name,
        grade_class: u.grade_class
      }));
      return res.status(200).json({ success: true, demoAccounts: safeDemo });
    }

    // 4. 取得指定使用者資訊
    const userId = req.query.user_id || (body && body.user_id);
    if (userId) {
      const user = db.users.find(u => u.id === userId);
      if (user) {
        const { password: _, ...userSafe } = user;
        return res.status(200).json({ success: true, user: userSafe });
      }
    }

    return res.status(400).json({ success: false, error: '未支援的認證操作' });
  } catch (err) {
    console.error('API /api/auth error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
