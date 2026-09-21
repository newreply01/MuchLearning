/**
 * api/db.js - 全方位教學評量系統持久化資料庫引擎
 * 支援 Vercel Serverless Function 與本機 Node.js
 * 實作關聯式資料模型：會員(Users)、試卷碼(Exam Papers)、交卷紀錄(Submissions)、
 * 個人錯題本(Mistakes)、教師協作成題庫(Custom Questions)
 */

const fs = require('fs');
const path = require('path');

// 決定資料庫儲存路徑 (Vercel serverless 環境寫入 /tmp，本機寫入 data/)
function getDbPath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'muchlearning_db.json');
  }
  const localDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(localDir)) {
    try { fs.mkdirSync(localDir, { recursive: true }); } catch (e) {}
  }
  return path.join(localDir, 'muchlearning_db.json');
}

// 預設初始種子資料 (保證系統隨時立即可測)
const SEED_DATA = {
  users: [
    {
      id: 'u-teacher-1',
      username: 'teacher',
      password: '123',
      real_name: '王大成 老師',
      role: 'teacher',
      school_name: '台北市立示範國小',
      grade_class: '三年二班',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'u-student-1',
      username: 'student',
      password: '123',
      real_name: '李小明',
      role: 'student',
      school_name: '台北市立示範國小',
      grade_class: '三年二班',
      seat_number: '07',
      created_at: '2026-09-01T08:30:00Z'
    },
    {
      id: 'u-parent-1',
      username: 'parent',
      password: '123',
      real_name: '李爸爸 (家長)',
      role: 'parent',
      school_name: '台北市立示範國小',
      grade_class: '三年二班',
      child_name: '李小明',
      created_at: '2026-09-01T09:00:00Z'
    }
  ],
  exam_papers: [
    {
      id: 'paper-k3-demo',
      exam_code: 'K3-8942',
      title: '康軒版國語 三年級上學期 第1~4課 段考複習卷',
      subtitle: '全班標準化指定測驗・嚴選生字詞與生活情境成語',
      created_by: 'u-teacher-1',
      author_name: '王大成 老師',
      time_limit_minutes: 20,
      shuffle_options: false,
      is_active: true,
      created_at: '2026-09-15T10:00:00Z',
      questions: [
        {
          id: 'q-demo-1',
          quizType: 'zhuyin',
          subType: 'write_char',
          promptSentence: '請寫出「（　　）[注音：ㄐ｜ㄣˇ　ㄕㄣˋ]」的國字。',
          promptLabel: '【看音辨國字】（注音：ㄐ｜ㄣˇ　ㄕㄣˋ）',
          options: ['謹慎', '吩咐', '敏捷', '徘徊'],
          correctAnswer: '謹慎',
          handwriteHint: '國字填寫：（ ＿＿＿＿ ）'
        },
        {
          id: 'q-demo-2',
          quizType: 'typo',
          targetChar: '茅',
          typoChar: '矛',
          typoWord: '名列前矛',
          typoSentence: '他平時用功學習，在期末評量中名列前矛。',
          promptSentence: '下列文句中畫底線處含有一個錯別字，請選出改正後的正確字：<br>「他平時用功學習，在期末評量中【<u>名列前矛</u>】。」',
          options: ['茅', '矛', '茂', '苗'],
          correctAnswer: '茅'
        },
        {
          id: 'q-demo-3',
          quizType: 'situational',
          promptSentence: '如果有人想表達「比喻犯錯或遭遇挫折後及時補救，尚可防患未然」的意思，最恰當的成語是：',
          options: ['亡羊補牢', '井底之蛙', '守株待兔', '走馬看花'],
          correctAnswer: '亡羊補牢'
        },
        {
          id: 'q-demo-4',
          quizType: 'synonym',
          promptSentence: '下列選項中，何者的詞義與「徘徊」最相近？',
          options: ['盤桓', '果決', '謹慎', '燦爛'],
          correctAnswer: '盤桓',
          targetWord: '徘徊',
          synonymWord: '盤桓'
        },
        {
          id: 'q-demo-5',
          quizType: 'conjunction',
          promptSentence: '請在下列句子的空格中填入最恰當的關聯詞語：<br>「這次旅行【　　】美麗的風景和豐富的文化體驗，還有無數令人感動的回憶。」',
          options: ['不僅有…和…還有…', '雖然…但是…', '如果…就…', '因為…所以…'],
          correctAnswer: '不僅有…和…還有…'
        },
        {
          id: 'q-demo-6',
          quizType: 'unscramble',
          cleanSentence: '夏日的夜空中綻放著燦爛奪目的煙火',
          options: ['甲乙丙丁', '乙甲丙丁', '丙甲乙丁', '丁丙乙甲'],
          correctAnswer: '甲乙丙丁',
          labeledCards: [
            { label: '甲', text: '夏日的' },
            { label: '乙', text: '夜空中' },
            { label: '丙', text: '綻放著' },
            { label: '丁', text: '燦爛煙火' }
          ]
        },
        {
          id: 'q-demo-7',
          quizType: 'sentence',
          word: '一面走路、一面吟誦',
          promptSentence: '照樣仿寫練習：【一面走路、一面吟誦】',
          correctAnswer: '一面走路、一面吟誦'
        },
        {
          id: 'q-demo-8',
          quizType: 'cloze',
          word: '守株待兔',
          promptSentence: '做事要腳踏實地，如果只是【　　　　】，終究不會有成果。',
          options: ['守株待兔', '走馬看花', '名副其實', '水落石出'],
          correctAnswer: '守株待兔'
        },
        {
          id: 'q-demo-9',
          quizType: 'cloze',
          word: '敏捷',
          promptSentence: '獵豹以【　　　　】的身手在草原上奔馳追逐獵物。',
          options: ['敏捷', '遲鈍', '澎湃', '吩咐'],
          correctAnswer: '敏捷'
        },
        {
          id: 'q-demo-10',
          quizType: 'situational',
          promptSentence: '面對「這幅畫加上落日餘暉的色彩，真有奇妙的畫龍點睛效果」這樣的生活情境，最適合用下列哪一個成語來形容概括？',
          options: ['畫龍點睛', '胸有成竹', '按部就班', '自出機杼'],
          correctAnswer: '畫龍點睛'
        }
      ]
    }
  ],
  exam_submissions: [
    {
      id: 'sub-1',
      exam_code: 'K3-8942',
      user_id: 'u-student-1',
      student_name: '李小明',
      seat_number: '07',
      score: 90,
      total_questions: 10,
      correct_count: 9,
      duration_seconds: 480,
      submitted_at: '2026-09-18T14:20:00Z',
      answers: { '1': '謹慎', '2': '茅', '3': '亡羊補牢', '4': '盤桓', '5': '不僅有…和…還有…', '6': '甲乙丙丁', '7': '一邊唱歌、一邊跳舞', '8': '守株待兔', '9': '敏捷', '10': '胸有成竹' }
    },
    {
      id: 'sub-2',
      exam_code: 'K3-8942',
      user_id: null,
      student_name: '陳雅筑',
      seat_number: '12',
      score: 100,
      total_questions: 10,
      correct_count: 10,
      duration_seconds: 420,
      submitted_at: '2026-09-18T14:22:00Z',
      answers: {}
    },
    {
      id: 'sub-3',
      exam_code: 'K3-8942',
      user_id: null,
      student_name: '張家豪',
      seat_number: '03',
      score: 80,
      total_questions: 10,
      correct_count: 8,
      duration_seconds: 510,
      submitted_at: '2026-09-18T14:25:00Z',
      answers: {}
    },
    {
      id: 'sub-4',
      exam_code: 'K3-8942',
      user_id: null,
      student_name: '林子軒',
      seat_number: '18',
      score: 70,
      total_questions: 10,
      correct_count: 7,
      duration_seconds: 590,
      submitted_at: '2026-09-18T14:30:00Z',
      answers: {}
    }
  ],
  user_mistakes: [
    {
      id: 'm-1',
      user_id: 'u-student-1',
      exam_code: 'K3-8942',
      question_id: 'q-demo-10',
      quizType: 'situational',
      promptSentence: '面對「這幅畫加上落日餘暉的色彩，真有奇妙的畫龍點睛效果」這樣的生活情境，最適合用下列哪一個成語來形容概括？',
      wrong_answer: '胸有成竹',
      correct_answer: '畫龍點睛',
      explanation: '畫龍點睛比喻在關鍵處加上精闢字句或修飾，使整體內容更加生動傳神。',
      mistake_count: 1,
      is_resolved: false,
      updated_at: '2026-09-18T14:20:00Z'
    },
    {
      id: 'm-2',
      user_id: 'u-student-1',
      exam_code: 'K3-8942',
      quizType: 'typo',
      promptSentence: '下列文句中畫底線處含有一個錯別字，請選出改正後的正確字：<br>「做事要有條有理，【<u>按步就班</u>】。」',
      wrong_answer: '簿',
      correct_answer: '部',
      explanation: '「按部就班」指做事按照規矩步驟進行，應作「部」，不可寫成「步」。',
      mistake_count: 2,
      is_resolved: false,
      updated_at: '2026-09-17T11:15:00Z'
    }
  ],
  custom_questions: [
    {
      id: 'cq-1',
      created_by: 'u-teacher-1',
      author_name: '王大成 老師',
      quiz_type: 'typo',
      press: 'kangxuan',
      grade: 3,
      semester: 1,
      lesson_num: 2,
      prompt: '下列文句中畫底線處含有一個錯別字，請選出改正後的正確字：<br>「微風輕拂，湖面上泛起陣陣【<u>連漪</u>】。」',
      options_json: '["漣", "連", "蓮", "聯"]',
      correct_answer: '漣',
      explanation: '「漣漪」指水面上細微的波紋，應作「漣」，不可寫成「連」。',
      status: 'approved',
      reviewed_by: '王大成 老師',
      created_at: '2026-09-10T11:00:00Z'
    },
    {
      id: 'cq-2',
      created_by: 'u-teacher-1',
      author_name: '王大成 老師',
      quiz_type: 'situational',
      press: 'nanyi',
      grade: 4,
      semester: 1,
      lesson_num: 3,
      prompt: '形容一個人見識非常短淺，只能看到狹小天地，最恰當的成語是：',
      options_json: '["井底之蛙", "百步穿楊", "名列前茅", "按部就班"]',
      correct_answer: '井底之蛙',
      explanation: '井底之蛙比喻見識狹隘之人。',
      status: 'pending',
      reviewed_by: null,
      created_at: '2026-09-19T09:30:00Z'
    }
  ]
};

// 讀取全庫
function loadDatabase() {
  const dbPath = getDbPath();
  try {
    if (fs.existsSync(dbPath)) {
      const str = fs.readFileSync(dbPath, 'utf8');
      const clean = str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
      const data = JSON.parse(clean.trim());
      return {
        users: data.users || SEED_DATA.users,
        exam_papers: data.exam_papers || SEED_DATA.exam_papers,
        exam_submissions: data.exam_submissions || SEED_DATA.exam_submissions,
        user_mistakes: data.user_mistakes || SEED_DATA.user_mistakes,
        custom_questions: data.custom_questions || SEED_DATA.custom_questions
      };
    }
  } catch (e) {
    console.error('loadDatabase error:', e.message);
  }

  // 首次初始化並寫入種子資料
  saveDatabase(SEED_DATA);
  return JSON.parse(JSON.stringify(SEED_DATA));
}

// 寫入資料庫
function saveDatabase(data) {
  const dbPath = getDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('saveDatabase error:', e.message);
    return false;
  }
}

module.exports = {
  loadDatabase,
  saveDatabase
};
