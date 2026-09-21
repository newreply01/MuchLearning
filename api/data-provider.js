/**
 * data-provider.js - 伺服端高速題庫快取與智慧組卷引擎
 * 適用於 Vercel Serverless Function 與本機 Node.js 伺服器
 */

const fs = require('fs');
const path = require('path');

// 模組內部全域快取 (實例生命週期內僅載入一次)
let cachedRawBank = null;
let cachedBankByType = null;
let cachedTextbookData = null;
let cachedIdioms150 = null;

// 國小國中教育部標準易錯成語對照庫
const IDIOM_TYPO_MAP = {
  '字字珠璣': { target: '璣', typo: '譏', distractors: ['磯', '機'] },
  '委曲求全': { target: '曲', typo: '屈', distractors: ['取', '趨'] },
  '載歌載舞': { target: '載', typo: '再', distractors: ['在', '仔'] },
  '按部就班': { target: '部', typo: '步', distractors: ['簿', '佈'] },
  '迫不及待': { target: '及', typo: '急', distractors: ['即', '極'] },
  '名列前茅': { target: '茅', typo: '矛', distractors: ['茂', '苗'] },
  '再接再厲': { target: '厲', typo: '利', distractors: ['勵', '例'] },
  '一籌莫展': { target: '籌', typo: '愁', distractors: ['仇', '綢'] },
  '心無旁騖': { target: '騖', typo: '鶩', distractors: ['務', '霧'] },
  '趨之若鶩': { target: '鶩', typo: '騖', distractors: ['霧', '誤'] },
  '走投無路': { target: '投', typo: '頭', distractors: ['透', '偷'] },
  '破釜沉舟': { target: '釜', typo: '斧', distractors: ['府', '俯'] },
  '水乳交融': { target: '融', typo: '容', distractors: ['榮', '溶'] },
  '墨守成規': { target: '規', typo: '歸', distractors: ['龜', '規'] },
  '濫竽充數': { target: '竽', typo: '魚', distractors: ['於', '芋'] },
  '草菅人命': { target: '菅', typo: '管', distractors: ['官', '館'] },
  '滄海一粟': { target: '滄', typo: '蒼', distractors: ['藏', '艙'] },
  '世外桃源': { target: '源', typo: '園', distractors: ['原', '員'] },
  '刻骨銘心': { target: '銘', typo: '名', distractors: ['明', '鳴'] },
  '班門弄斧': { target: '班', typo: '般', distractors: ['斑', '伴'] },
  '甘拜下風': { target: '甘', typo: '柑', distractors: ['竿', '肝'] },
  '怨天尤人': { target: '尤', typo: '憂', distractors: ['優', '幼'] },
  '病入膏肓': { target: '肓', typo: '盲', distractors: ['芒', '忙'] },
  '挑撥離間': { target: '間', typo: '漸', distractors: ['簡', '建'] },
  '鋌而走險': { target: '鋌', typo: '挺', distractors: ['庭', '艇'] },
  '針砭時弊': { target: '砭', typo: '貶', distractors: ['邊', '蝙'] },
  '買櫝還珠': { target: '櫝', typo: '讀', distractors: ['獨', '牘'] },
  '美輪美奐': { target: '輪', typo: '倫', distractors: ['論', '綸'] },
  '汗流浹背': { target: '浹', typo: '夾', distractors: ['頰', '佳'] },
  '言簡意賅': { target: '賅', typo: '該', distractors: ['概', '改'] },
  '怨聲載道': { target: '載', typo: '在', distractors: ['再', '仔'] },
  '提心吊膽': { target: '提', typo: '題', distractors: ['啼', '蹄'] },
  '金榜題名': { target: '題', typo: '提', distractors: ['啼', '體'] },
  '銷聲匿跡': { target: '銷', typo: '消', distractors: ['宵', '削'] },
  '自出機杼': { target: '杼', typo: '抒', distractors: ['序', '敘'] },
  '聲名鵲起': { target: '鵲', typo: '雀', distractors: ['確', '缺'] },
  '名落孫山': { target: '名', typo: '明', distractors: ['鳴', '銘'] },
  '鬼斧神工': { target: '斧', typo: '釜', distractors: ['府', '負'] },
  '川流不息': { target: '川', typo: '穿', distractors: ['船', '串'] },
  '不脛而走': { target: '脛', typo: '逕', distractors: ['徑', '境'] },
  '好高騖遠': { target: '騖', typo: '務', distractors: ['霧', '誤'] },
  '蓬蓽生輝': { target: '蓽', typo: '壁', distractors: ['璧', '畢'] },
  '絡繹不絕': { target: '絕', typo: '決', distractors: ['掘', '覺'] },
  '妄自菲薄': { target: '妄', typo: '忘', distractors: ['望', '汪'] },
  '陳詞濫調': { target: '濫', typo: '爛', distractors: ['藍', '覽'] },
  '風聲鶴唳': { target: '唳', typo: '淚', distractors: ['類', '立'] },
  '相輔相成': { target: '成', typo: '承', distractors: ['程', '誠'] },
  '罄竹難書': { target: '罄', typo: '慶', distractors: ['請', '親'] },
  '大名鼎鼎': { target: '鼎', typo: '頂', distractors: ['定', '訂'] },
  '風馳電掣': { target: '馳', typo: '弛', distractors: ['遲', '池'] },
  '膾炙人口': { target: '炙', typo: '灸', distractors: ['炙', '久'] },
  '嘔心瀝血': { target: '瀝', typo: '歷', distractors: ['勵', '立'] },
  '瑕不掩瑜': { target: '瑕', typo: '暇', distractors: ['霞', '遐'] },
  '目不暇給': { target: '暇', typo: '瑕', distractors: ['霞', '遐'] },
  '首當其衝': { target: '首', typo: '手', distractors: ['守', '受'] },
  '別出心裁': { target: '裁', typo: '財', distractors: ['材', '才'] },
  '喧賓奪主': { target: '喧', typo: '宣', distractors: ['軒', '萱'] },
  '脫穎而出': { target: '穎', typo: '影', distractors: ['景', '引'] },
  '未雨綢繆': { target: '繆', typo: '謀', distractors: ['眸', '模'] },
  '如火如荼': { target: '荼', typo: '茶', distractors: ['涂', '途'] },
  '浮光掠影': { target: '掠', typo: '略', distractors: ['掠', '落'] },
  '重蹈覆轍': { target: '轍', typo: '徹', distractors: ['澈', '撤'] },
  '含飴弄孫': { target: '飴', typo: '怡', distractors: ['宜', '儀'] },
  '因噎廢食': { target: '噎', typo: '業', distractors: ['夜', '葉'] },
  '耳濡目染': { target: '濡', typo: '如', distractors: ['儒', '孺'] },
  '一諾千金': { target: '諾', typo: '若', distractors: ['弱', '落'] },
  '剛愎自用': { target: '愎', typo: '復', distractors: ['腹', '副'] },
  '融會貫通': { target: '融', typo: '容', distractors: ['榮', '溶'] },
  '心力交瘁': { target: '瘁', typo: '脆', distractors: ['翠', '粹'] },
  '集思廣益': { target: '益', typo: '意', distractors: ['義', '議'] },
  '精益求精': { target: '益', typo: '意', distractors: ['義', '易'] },
  '直截了當': { target: '截', typo: '接', distractors: ['結', '節'] },
  '出奇制勝': { target: '制', typo: '致', distractors: ['治', '智'] },
  '仗義執言': { target: '執', typo: '直', distractors: ['植', '值'] },
  '無懈可擊': { target: '懈', typo: '解', distractors: ['界', '借'] },
  '氣喘吁吁': { target: '吁', typo: '噓', distractors: ['虛', '需'] },
  '按圖索驥': { target: '驥', typo: '計', distractors: ['記', '際'] },
  '循序漸進': { target: '漸', typo: '見', distractors: ['建', '件'] },
  '休戚相關': { target: '戚', typo: '七', distractors: ['期', '欺'] },
  '兢兢業業': { target: '兢', typo: '驚', distractors: ['晶', '精'] },
  '分道揚鑣': { target: '鑣', typo: '標', distractors: ['飆', '鏢'] },
  '孤注一擲': { target: '擲', typo: '鄭', distractors: ['正', '證'] },
  '義憤填膺': { target: '膺', typo: '鷹', distractors: ['應', '櫻'] },
  '一丘之貉': { target: '貉', typo: '駱', distractors: ['洛', '落'] },
  '如雷貫耳': { target: '貫', typo: '慣', distractors: ['冠', '官'] },
  '瞠目結舌': { target: '瞠', typo: '堂', distractors: ['常', '長'] },
  '如釋重負': { target: '負', typo: '付', distractors: ['副', '富'] },
  '捉襟見肘': { target: '肘', typo: '宙', distractors: ['軸', '周'] },
  '大快朵頤': { target: '頤', typo: '儀', distractors: ['宜', '姨'] }
};

// 常見字元級形音義易混淆字組庫
const CHAR_TYPO_MAP = {
  '部': ['步', '佈', '簿'],
  '步': ['部', '布'],
  '矛': ['茅', '毛'],
  '茅': ['矛', '茂'],
  '及': ['急', '即', '極'],
  '急': ['及', '疾', '級'],
  '厲': ['利', '勵', '例'],
  '利': ['厲', '俐', '立'],
  '題': ['提', '啼', '蹄'],
  '提': ['題', '啼', '體'],
  '規': ['歸', '龜'],
  '歸': ['規', '瑰'],
  '絕': ['決', '掘', '截'],
  '決': ['絕', '覺'],
  '蜂': ['峰', '烽', '鋒'],
  '峰': ['蜂', '烽', '鋒'],
  '湧': ['勇', '踴', '泳'],
  '勇': ['湧', '踴'],
  '容': ['融', '榮', '榕'],
  '融': ['容', '榮', '溶'],
  '景': ['井', '境'],
  '致': ['至', '智', '志'],
  '辨': ['辯', '辮', '辦'],
  '截': ['接', '結'],
  '再': ['在'],
  '在': ['再'],
  '度': ['渡'],
  '宣': ['喧', '暄'],
  '蔚': ['慰', '衛'],
  '滄': ['蒼', '艙'],
  '券': ['卷', '圈'],
  '聯': ['連', '蓮'],
  '藉': ['借', '籍'],
  '副': ['幅', '福', '富'],
  '馳': ['弛', '池', '持'],
  '濫': ['爛', '藍', '籃'],
  '璧': ['壁', '臂', '避'],
  '籌': ['愁', '綢', '仇'],
  '概': ['慨', '溉'],
  '履': ['屢', '縷'],
  '段': ['鍛', '斷'],
  '練': ['鍊', '戀'],
  '甘': ['柑', '肝'],
  '迫': ['破', '魄'],
  '名': ['明', '鳴', '銘'],
  '班': ['般', '斑'],
  '抒': ['舒', '殊'],
  '煞': ['殺', '剎'],
  '促': ['蹙', '卒'],
  '俏': ['悄', '峭'],
  '按': ['安', '案'],
  '首': ['手', '守'],
  '曲': ['屈', '趨']
};

/**
 * 載入並快取題庫資料
 */
function loadDataSources() {
  if (cachedRawBank && cachedTextbookData) {
    return {
      rawBank: cachedRawBank,
      bankByType: cachedBankByType,
      textbookData: cachedTextbookData,
      idioms150: cachedIdioms150
    };
  }

  // 嘗試多個可能路徑 (兼顧 Vercel Serverless 與 本機開發)
  const candidateDirs = [
    path.join(__dirname, '..', 'data'),
    path.join(process.cwd(), 'data'),
    path.join(__dirname, 'data')
  ];

  let dataDir = candidateDirs[0];
  for (let dir of candidateDirs) {
    if (fs.existsSync(path.join(dir, 'question_bank.json'))) {
      dataDir = dir;
      break;
    }
  }

  function safeParse(str, fallback) {
    if (!str) return fallback;
    try {
      const clean = str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
      return JSON.parse(clean.trim());
    } catch (e) {
      console.error('safeParse JSON error:', e.message);
      return fallback;
    }
  }

  // 1. 載入 31,302 筆題庫
  const qBankPath = path.join(dataDir, 'question_bank.json');
  let rawBank = [];
  if (fs.existsSync(qBankPath)) {
    const rawStr = fs.readFileSync(qBankPath, 'utf8');
    rawBank = safeParse(rawStr, []);
  }

  // 2. 載入教科書生字詞庫
  const tbPath = path.join(dataDir, 'textbook_data.json');
  let textbookData = { curriculum: {} };
  if (fs.existsSync(tbPath)) {
    const tbStr = fs.readFileSync(tbPath, 'utf8');
    textbookData = safeParse(tbStr, { curriculum: {} });
  }

  // 3. 載入 150 則成語
  const idPath = path.join(dataDir, 'idiom_list_150.json');
  let idioms150 = [];
  if (fs.existsSync(idPath)) {
    const idStr = fs.readFileSync(idPath, 'utf8');
    idioms150 = safeParse(idStr, []);
  }

  // 分類與擴充
  const bankByType = {
    idiom: rawBank.filter(i => i.type === 'idiom'),
    vocabulary: rawBank.filter(i => i.type === 'vocabulary'),
    sentence: rawBank.filter(i => i.type === 'sentence'),
    ellipsis: rawBank.filter(i => {
      if (i.type !== 'ellipsis') return false;
      if (!i.pattern || !i.pattern.includes('…')) return false;
      if (!i.example || i.example.length < 10) return false;
      if (i.example.includes('發揮想像力') || i.example.includes('請依') || i.example.includes('完成完整造句')) return false;
      if (i.example.startsWith('(') || i.example.startsWith('（')) return false;
      return true;
    }),
    withSynonyms: rawBank.filter(i => i.synonyms && i.synonyms.trim().length > 0),
    withZhuyin: rawBank.filter(i => i.zhuyin && i.zhuyin.trim().length > 0),
    idiomLow: [],
    idiomMid: [],
    idiomHigh: []
  };

  const rawMap = new Map();
  rawBank.forEach(item => {
    if (item.word) rawMap.set(item.word, item);
  });

  // 融合 150 則教育部成語
  idioms150.forEach(item => {
    const matched = rawMap.get(item.word);
    const enriched = matched ? {
      ...matched,
      level: item.level,
      levelText: item.levelText,
      zhuyin: item.zhuyin || matched.zhuyin
    } : {
      id: `idiom-150-${item.word}`,
      type: 'idiom',
      category_name: `教育部成語(${item.levelText})`,
      word: item.word,
      title: item.word,
      zhuyin: item.zhuyin,
      definition: `教育部國小官方推薦常用成語（${item.levelText}）。`,
      example: '',
      synonyms: '',
      antonyms: '',
      difficulty: item.level === 'low' ? 'elementary' : 'junior_high',
      level: item.level,
      levelText: item.levelText
    };

    if (item.level === 'low') bankByType.idiomLow.push(enriched);
    else if (item.level === 'mid') bankByType.idiomMid.push(enriched);
    else if (item.level === 'high') bankByType.idiomHigh.push(enriched);

    if (!matched) {
      rawBank.push(enriched);
      bankByType.idiom.push(enriched);
      if (enriched.zhuyin) bankByType.withZhuyin.push(enriched);
    }
  });

  cachedRawBank = rawBank;
  cachedBankByType = bankByType;
  cachedTextbookData = textbookData;
  cachedIdioms150 = idioms150;

  return {
    rawBank: cachedRawBank,
    bankByType: cachedBankByType,
    textbookData: cachedTextbookData,
    idioms150: cachedIdioms150
  };
}

// 輔助函式
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRandomSample(arr, n) {
  if (!arr || arr.length === 0) return [];
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function formatZhuyin(rawZhuyin) {
  if (!rawZhuyin || typeof rawZhuyin !== 'string') return '';
  let clean = rawZhuyin.replace(/<[^>]+>/g, '').replace(/\/td>.*$/i, '').trim();
  if (!clean) return '';
  let parts = clean.split(/\s+/).filter(s => s.length > 0);
  if (parts.length === 1 && clean.length > 2) {
    const segmented = clean
      .replace(/([ˊˇˋ])([ㄅ-ㄙㄧㄨㄩ｜ㄚ-ㄦ])/g, '$1 $2')
      .replace(/([ㄧㄨㄩ｜ㄚ-ㄦ])(˙[ㄅ-ㄙㄧㄨㄩ｜ㄚ-ㄦ])/g, '$1 $2')
      .replace(/([ㄧㄨㄩ｜ㄚ-ㄦ])([ㄅ-ㄙ])/g, '$1 $2');
    parts = segmented.split(/\s+/).filter(s => s.length > 0);
  }
  return parts.join('　');
}

/**
 * 深入清洗字詞釋義與例句，嚴格杜絕題目洩漏解答：
 * 1. 提取隱藏在 definition 中的真實造句 (例如 "造句：故宮博物院典藏許多古代官家所藏的珍玩。")
 * 2. 徹底濾除釋義中的造句、引文出處（如「紅樓夢˙第五十二回...」）、書證例句、如：「...」
 * 3. 若目標字詞依然出現在釋義中，強制替換為掩碼「【　　】」，100% 保證題幹絕不出現答案
 */
function sanitizeItemForQuestion(item) {
  if (!item) return { cleanExample: '', cleanDef: '' };
  const word = item.word || '';
  let ex = item.example || '';
  let def = item.definition || '';

  // 1. 如果原始 example 未包含目標詞，嘗試從 definition 的「造句：」或「例句：」中提取
  if (!ex || !ex.includes(word)) {
    const m = def.match(/(?:造句|例句)\s*[:：]\s*([^。！？\n\r]+[。！？]?)/);
    if (m && m[1] && m[1].includes(word)) {
      ex = m[1].trim();
    }
  }

  // 2. 清除 definition 內的所有附帶造句、典籍引文、出處書證、別稱變體、如：「...」
  let cleanDef = def || '';
  cleanDef = cleanDef.split(/(?:語本|語出|語見|典出|書證|出處|亦作|或作|亦稱|參見|〔例|\[例|△)/)[0];
  cleanDef = cleanDef.split(/(?:造句|例句|如|例|§)\s*[:：]/)[0];
  cleanDef = cleanDef.replace(/(?:如|例如)\s*[：:「].*$/, '').trim();
  cleanDef = cleanDef.replace(/(?:[，、；。]|\s+)?[\w\u4e00-\u9fa5〇○\d《》〈〉]{1,20}[·˙・].*$/g, '');
  cleanDef = cleanDef.replace(/^[\d\.\s、]+/g, '').trim();

  // 若清理後只剩標點或過短，保留原前段
  if (!cleanDef && def) {
    cleanDef = def.split(/[。！？\n]/)[0].trim();
  }

  // 避免釋義過長難以閱讀（考試用紙排版最適長度約 45 字內）
  if (cleanDef.length > 45) {
    cleanDef = cleanDef.slice(0, 42).replace(/[，、；]$/, '') + '…';
  }

  // 確保結尾具備完整標點
  if (cleanDef && !/[。！？…]$/.test(cleanDef)) {
    cleanDef += '。';
  }

  // 3. 嚴格遮罩：釋義中若有目標詞，一律換成「【　　】」
  if (word && cleanDef.includes(word)) {
    cleanDef = cleanDef.replace(new RegExp(escapeRegExp(word), 'g'), '【　　】');
  }

  // 4. 清理例句中的「造句：」前綴
  if (ex) {
    ex = ex.replace(/^(?:造句|例句|例|如)\s*[:：]\s*/, '').trim();
  }

  return { cleanExample: ex, cleanDef };
}

/**
 * 判斷是否為實質高品質情境例句（杜絕任何空泛罐頭模板）
 */
function isGenuineExample(sentence, word) {
  if (!sentence || typeof sentence !== 'string') return false;
  if (!word || !sentence.includes(word)) return false;
  if (sentence.includes('掌握') && sentence.includes('用法')) return false;
  if (sentence.includes('認真體會') || sentence.includes('適切引用') || sentence.includes('生動生輝')) return false;
  if (sentence.includes('在文章中恰當地使用了') || sentence.includes('日常生活中常說')) return false;
  if (sentence.includes('請寫出') || sentence.includes('完成完整造句') || sentence.includes('發揮想像力')) return false;
  if (sentence.includes('教育部國小官方推薦') || sentence.includes('課文生字語詞')) return false;
  if (sentence.includes('」、「')) return false; // 排除「詞語1」、「詞語2」名詞串列
  const stripped = sentence.replace(/[「」『』【】（）\s，、。！？；]/g, '');
  if (stripped.length <= word.length + 3) return false;
  return true;
}

/**
 * 取得字數/詞性嚴格對齊的干擾選項 (保證單字配單字、成語配成語、二字詞配二字詞)
 */
function getConsistentDistractors(targetWord, pool = [], count = 3, rawBankFallback = []) {
  if (!targetWord) return [];
  const targetLen = targetWord.length;
  const isSingle = (targetLen === 1);
  const isIdiom = (targetLen === 4);

  // 1. 同長度候選詞 (優先)
  let candidates = (pool || []).filter(item => {
    const w = (typeof item === 'string') ? item : (item.word || item.title || '');
    if (!w || w === targetWord) return false;
    if (w.includes(targetWord) || targetWord.includes(w)) return false;
    return w.length === targetLen;
  });

  // 2. 若同長度候選不足，從 rawBankFallback 補充同長度詞
  if (candidates.length < count && rawBankFallback && rawBankFallback.length > 0) {
    const existingWords = new Set(candidates.map(i => typeof i === 'string' ? i : (i.word || i.title)));
    existingWords.add(targetWord);
    const extra = rawBankFallback.filter(item => {
      const w = (typeof item === 'string') ? item : (item.word || item.title || '');
      if (!w || existingWords.has(w)) return false;
      if (w.includes(targetWord) || targetWord.includes(w)) return false;
      return w.length === targetLen;
    });
    candidates = [...candidates, ...extra];
  }

  // 3. 防禦補齊（單字生字與四字成語嚴格禁止跨字數混雜）
  if (candidates.length < count && !isSingle && !isIdiom) {
    const existingWords = new Set(candidates.map(i => typeof i === 'string' ? i : (i.word || i.title)));
    existingWords.add(targetWord);
    const fallbackSource = (rawBankFallback && rawBankFallback.length > 0) ? rawBankFallback : pool;
    const extra = (fallbackSource || []).filter(item => {
      const w = (typeof item === 'string') ? item : (item.word || item.title || '');
      if (!w || existingWords.has(w)) return false;
      return Math.abs(w.length - targetLen) <= 1 && w.length >= 2;
    });
    candidates = [...candidates, ...extra];
  }

  const chosen = getRandomSample(candidates, count);
  return chosen.map(i => typeof i === 'string' ? i : (i.word || i.title));
}

/**
 * 取得音節長度對齊的注音干擾選項 (二字詞配二音節注音、三字詞配三音節注音)
 */
function getConsistentZhuyinDistractors(targetZhuyin, poolWithZhuyin = [], count = 3) {
  if (!targetZhuyin || !poolWithZhuyin || poolWithZhuyin.length === 0) return [];
  const formattedTarget = formatZhuyin(targetZhuyin);
  const targetPartsCount = formattedTarget.split(/\s+/).length;

  let candidates = poolWithZhuyin.filter(item => {
    if (!item.zhuyin) return false;
    const fz = formatZhuyin(item.zhuyin);
    if (!fz || fz === formattedTarget) return false;
    return fz.split(/\s+/).length === targetPartsCount;
  });

  if (candidates.length < count) {
    candidates = poolWithZhuyin.filter(item => {
      if (!item.zhuyin) return false;
      const fz = formatZhuyin(item.zhuyin);
      return fz && fz !== formattedTarget;
    });
  }

  return getRandomSample(candidates, count).map(i => formatZhuyin(i.zhuyin));
}

// 題型建構器
function buildClozeQuestion(item, pool, rawBankRef) {
  if (!item || !item.word) return null;
  const { cleanExample, cleanDef } = sanitizeItemForQuestion(item);
  let maskedSentence = '';
  const isSingleChar = (item.word.length === 1);
  const isIdiom = (item.word.length === 4 || item.type === 'idiom');
  const termLabel = isSingleChar ? '生字' : (isIdiom ? '成語' : '詞語');

  if (isGenuineExample(cleanExample, item.word)) {
    let cleanSentence = cleanExample.replace(/^[「"『\s]+/, '').replace(/[」"』\s]+$/, '');
    const masked = cleanSentence.replace(new RegExp(escapeRegExp(item.word), 'g'), '【　　　　】');
    maskedSentence = `「${masked}」文句中最適當填入的${termLabel}是【　　　　】。`;
  } else if (cleanDef && cleanDef !== '課文生字語詞。') {
    let displayDef = cleanDef.replace(/^[12345１２３４５\.\s、]+/g, '').replace(/(?:如|例如)\s*[：:「].*$/, '').trim();
    if (displayDef.length > 40) displayDef = displayDef.slice(0, 38) + '…';
    if (!/[。！？…]$/.test(displayDef)) displayDef += '。';
    if (isSingleChar) {
      maskedSentence = `下列生字中，字義為「${displayDef}」的是【　　　　】。`;
    } else {
      maskedSentence = `下列${termLabel}中，意思為「${displayDef}」的是【　　　　】。`;
    }
  } else {
    maskedSentence = `下列文句中，最適當填入的${termLabel}是【　　　　】。`;
  }

  const distractors = getConsistentDistractors(item.word, pool, 3, rawBankRef);
  const options = shuffleArray([item.word, ...distractors]);

  return {
    ...item,
    quizType: 'cloze',
    promptSentence: maskedSentence,
    options,
    correctAnswer: item.word
  };
}

function buildZhuyinQuestion(item, poolWithZhuyin, rawBankRef) {
  if (!item || !item.word || !item.zhuyin) return null;
  const formatted = formatZhuyin(item.zhuyin);
  const isWriteChar = Math.random() > 0.5;

  if (isWriteChar) {
    let sentence = '';
    if (isGenuineExample(item.example, item.word)) {
      sentence = `「${item.example.replace(item.word, `（　　）[注音：${formatted}]`)}」文句中最適當填入的國字是：`;
    } else {
      sentence = `請選出注音為「${formatted}」的正確國字：`;
    }
    const distractors = getConsistentDistractors(item.word, poolWithZhuyin, 3, rawBankRef);
    const options = shuffleArray([item.word, ...distractors]);

    return {
      ...item,
      quizType: 'zhuyin',
      subType: 'write_char',
      promptSentence: sentence,
      promptLabel: `【看音辨國字】（注音：${formatted}）`,
      options,
      correctAnswer: item.word,
      handwriteHint: `國字填寫：（ ＿＿＿＿ ）`
    };
  } else {
    let sentence = `【看字辨注音】請選出【${item.word}】的正確注音：`;
    const distractors = getConsistentZhuyinDistractors(item.zhuyin, poolWithZhuyin, 3);
    const options = shuffleArray([formatted, ...distractors]);

    return {
      ...item,
      quizType: 'zhuyin',
      subType: 'write_zhuyin',
      promptSentence: sentence,
      promptLabel: `【看字辨注音】請選出【${item.word}】的正確注音`,
      options,
      correctAnswer: formatted,
      handwriteHint: `注音填寫：（ ＿＿＿＿ ）`
    };
  }
}

function buildTypoQuestion(item) {
  if (!item || !item.word || !item.example) return null;
  if (item.type === 'ellipsis' || item.word.includes('…') || item.word.length > 6 || item.word.length < 2) return null;
  if (!item.example.includes(item.word)) return null;

  let targetChar = '';
  let typoChar = '';
  let charIdx = -1;
  let customDistractors = [];

  if (IDIOM_TYPO_MAP[item.word]) {
    const entry = IDIOM_TYPO_MAP[item.word];
    targetChar = entry.target;
    typoChar = entry.typo;
    customDistractors = entry.distractors || [];
    charIdx = item.word.indexOf(targetChar);
  } else {
    const matchIndices = [];
    for (let i = 0; i < item.word.length; i++) {
      if (CHAR_TYPO_MAP[item.word[i]]) matchIndices.push(i);
    }
    if (matchIndices.length > 0) {
      charIdx = matchIndices[Math.floor(Math.random() * matchIndices.length)];
      targetChar = item.word[charIdx];
      const cands = CHAR_TYPO_MAP[targetChar];
      typoChar = cands[Math.floor(Math.random() * cands.length)];
    }
  }

  if (!targetChar || !typoChar || charIdx < 0) return null;

  const typoWord = item.word.substring(0, charIdx) + typoChar + item.word.substring(charIdx + 1);
  const typoSentence = item.example.replace(item.word, typoWord);

  let distractors = [];
  if (customDistractors && customDistractors.length >= 2) {
    distractors = customDistractors.slice(0, 2);
  } else {
    const cands = CHAR_TYPO_MAP[targetChar] ? CHAR_TYPO_MAP[targetChar].filter(c => c !== typoChar) : [];
    const fallbackList = ['容', '融', '榮', '提', '題', '步', '部', '厲', '利', '決', '絕'].filter(c => c !== targetChar && c !== typoChar && !cands.includes(c));
    distractors = [...cands, ...getRandomSample(fallbackList, Math.max(0, 2 - cands.length))].slice(0, 2);
  }

  const options = shuffleArray([targetChar, typoChar, ...distractors]);

  return {
    ...item,
    quizType: 'typo',
    targetChar,
    typoChar,
    typoWord,
    typoSentence,
    promptSentence: `下列文句中畫底線處含有一個錯別字，請選出改正後的正確字：<br>「${typoSentence.replace(typoWord, `【<u>${typoWord}</u>】`)}」`,
    options,
    correctAnswer: targetChar
  };
}

function buildSynonymQuestion(item, rawBank, bankByType) {
  let sourceItem = item;
  if (!sourceItem.synonyms) {
    const candidates = bankByType.withSynonyms;
    if (candidates.length > 0) {
      sourceItem = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  if (!sourceItem || !sourceItem.synonyms) return null;

  const synList = sourceItem.synonyms.split(/[、,，\s]+/).filter(s => s.trim().length > 0);
  const correctSyn = synList[0];
  if (!correctSyn) return null;

  let promptSentence = '';
  if (isGenuineExample(sourceItem.example, sourceItem.word)) {
    let cleanSentence = sourceItem.example.replace(/^[「"『\s]+/, '').replace(/[」"』\s]+$/, '');
    cleanSentence = cleanSentence.replace(sourceItem.word, `「${sourceItem.word}」`);
    promptSentence = `下列文句「　」中的詞語，替換為哪一個選項後，句子意思「最相近」？<br>「${cleanSentence}」`;
  } else {
    promptSentence = `下列選項中，何者的詞義與「${sourceItem.word}」最相近？`;
  }

  const distractors = getConsistentDistractors(correctSyn, rawBank, 3);
  const options = shuffleArray([correctSyn, ...distractors]);

  return {
    ...sourceItem,
    quizType: 'synonym',
    promptSentence,
    options,
    correctAnswer: correctSyn,
    targetWord: sourceItem.word,
    synonymWord: correctSyn
  };
}

const CONJUNCTION_SENTENCE_PRESETS = {
  '不但…而且…': '這本書【　　】內容豐富，【　　】插圖生動，深受同學們喜愛。',
  '雖然…但是…': '哥哥【　　】遇到了很多困難，【　　】他從不輕易放棄努力。',
  '如果…就…': '明天【　　】下雨，運動會【　　】改在室內體育館舉行。',
  '因為…所以…': '【　　】平時認真複習功課，【　　】他在考試中取得了優異的成績。',
  '無論…都…': '【　　】天氣多麼惡劣，郵差先生【　　】會準時把信件送到每家每戶。',
  '與其…不如…': '【　　】在原地嘆氣埋怨，【　　】挽起袖子立即行動。',
  '只有…才…': '【　　】持之以恆地練習，【　　】能彈奏出美妙動聽的樂曲。',
  '一方面…另一方面…': '他【　　】積極準備課堂測驗，【　　】抽空參與校園志工服務。',
  '不僅…還…': '這次戶外教學【　　】讓我們學到了自然知識，【　　】增進了彼此的友誼。',
  '只要…就…': '【　　】大家齊心協力，我們【　　】一定能克服眼前的難關。',
  '既然…就…': '你【　　】已經答應了別人，【　　】應該信守承諾全力以赴。',
  '儘管…還是…': '【　　】路途遙遠顛簸，大家【　　】滿懷熱情地準時到達目的地。',
  '除了…還…': '圖書館裡【　　】有豐富的中文書籍，【　　】收藏了各國精采的繪本。',
  '既…又…': '這間教室【　　】寬敞，【　　】明亮，是大家最喜歡的閱讀空間。',
  '一邊…一邊…': '小妹妹【　　】哼著歡快的兒歌，【　　】開心地整理自己的書包。',
  '有的…有的…': '操場上的同學【　　】在打籃球，【　　】在慢跑，充滿了活力。',
  '寧可…也不…': '他【　　】自己多花時間反覆檢查，【　　】願交出草率粗心的作業。',
  '與其…寧可…': '他【　　】自己多承擔一些工作，【　　】不願讓組員感到負擔太重。',
  '凡是…都…': '【　　】遇到不熟悉的題目，哥哥【　　】會主動向老師與同學請教。',
  '有了…才能…': '【　　】正確的心態以後，對待各種人事物【　　】更客觀、理性。',
  '只要…都可以…': '【　　】購買週年慶活動商品，【　　】參加摸彩活動。'
};

function escapeRegExp(string) {
  return (string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSituationalQuestion(item, bankByType) {
  const idiomBank = (bankByType && bankByType.idiom && bankByType.idiom.length) ? bankByType.idiom : [];
  let idiomItem = (item && item.type === 'idiom') ? item : getRandomSample(idiomBank, 1)[0];
  if (!idiomItem) return null;

  const isIdiom = (idiomItem.type === 'idiom' || idiomItem.word.length === 4);
  const termLabel = isIdiom ? '成語' : '詞語';

  const { cleanExample, cleanDef } = sanitizeItemForQuestion(idiomItem);
  let scenario = '';

  if (cleanExample && cleanExample.includes(idiomItem.word)) {
    // 必須將目標詞嚴格全域挖空為【　　　　】，絕不能把原詞留在情境中！
    const maskedEx = cleanExample.replace(new RegExp(escapeRegExp(idiomItem.word), 'g'), '【　　　　】');
    const templates = [
      `在「${maskedEx}」的文意情境中，空格處應填入哪一個${termLabel}最恰當？`,
      `閱讀下列文句：「${maskedEx}」，空格中最適合填入的${termLabel}是：`,
      `下列文句空格處，填入哪一個${termLabel}最切合文意？<br>「${maskedEx}」`,
      `面對「${maskedEx}」的語境，空格中最適合填入下列何者？`
    ];
    scenario = templates[Math.floor(Math.random() * templates.length)];
  } else if (cleanDef) {
    const templates = [
      `下列選項中，意思為「${cleanDef}」的${termLabel}是：`,
      `若想形容「${cleanDef}」的情況，最恰當的${termLabel}是：`,
      `「${cleanDef}」最適合用下列哪一個${termLabel}來概括？`,
      `下列哪一個${termLabel}的意思是「${cleanDef}」？`
    ];
    scenario = templates[Math.floor(Math.random() * templates.length)];
  } else {
    scenario = `下列選項中，最適當填入空格的${termLabel}是【　　　　】。`;
  }

  const distractorPool = isIdiom ? idiomBank : (bankByType && bankByType.rawBank ? bankByType.rawBank : idiomBank);
  const distractors = getRandomSample(distractorPool.filter(i => i.word !== idiomItem.word), 3).map(i => i.word);
  const options = shuffleArray([idiomItem.word, ...distractors]);

  return {
    ...idiomItem,
    quizType: 'situational',
    subCategory: isIdiom ? '【生活語境成語應用】' : '【生活語境詞彙理解】',
    promptSentence: scenario,
    options,
    correctAnswer: idiomItem.word
  };
}

function buildConjunctionQuestion(item, bankByType) {
  let ellItem = (item && item.type === 'ellipsis') ? item : getRandomSample(bankByType.ellipsis, 1)[0];
  if (!ellItem || !ellItem.pattern) return null;

  let masked = '';
  // 若原例句為高品質真實現成例句且不包含佔位符，優先遮罩
  if (ellItem.example && !ellItem.example.includes('發揮想像力') && !ellItem.example.includes('完成完整造句') && !ellItem.example.startsWith('(') && !ellItem.example.startsWith('（')) {
    const markers = ellItem.pattern.split(/[…\.⋯]+/).map(m => m.trim()).filter(m => m.length > 0);
    masked = ellItem.example;
    markers.forEach(m => {
      if (masked.includes(m)) {
        masked = masked.replace(new RegExp(escapeRegExp(m), 'g'), '【　　】');
      }
    });
  }

  // 若原例句無效或未成功遮罩，使用優質精選真實語境句庫
  if (!masked || !masked.includes('【　　】')) {
    if (CONJUNCTION_SENTENCE_PRESETS[ellItem.pattern]) {
      masked = CONJUNCTION_SENTENCE_PRESETS[ellItem.pattern];
    } else {
      const candidates = Object.keys(CONJUNCTION_SENTENCE_PRESETS);
      const randomPattern = candidates[Math.floor(Math.random() * candidates.length)];
      ellItem = { ...ellItem, pattern: randomPattern };
      masked = CONJUNCTION_SENTENCE_PRESETS[randomPattern];
    }
  }

  const candidateConjs = ['不僅…而且…', '雖然…但是…', '如果…就…', '因為…所以…', '無論…都…', '與其…不如…', '只有…才…', '一方面…另一方面…', '只要…就…', '凡是…都…'];
  const distractors = getRandomSample(candidateConjs.filter(c => c !== ellItem.pattern), 3);
  const options = shuffleArray([ellItem.pattern, ...distractors]);

  return {
    ...ellItem,
    quizType: 'conjunction',
    promptSentence: `請在下列句子的空格中填入最恰當的關聯詞語：<br>「${masked}」`,
    options,
    correctAnswer: ellItem.pattern
  };
}

function buildUnscrambleQuestion(item) {
  if (!item || !item.example || item.example.length < 10) return null;
  let clean = item.example.replace(/^[「"『\s]+/, '').replace(/[」"』\s]+$/, '').replace(/。$/, '');

  let chunks = [];
  if (clean.includes('，') || clean.includes('、')) {
    const parts = clean.split(/[，、]/).filter(p => p.trim().length > 0);
    if (parts.length >= 4) {
      chunks = parts.slice(0, 4);
    } else if (parts.length === 2) {
      chunks = [
        parts[0].slice(0, Math.ceil(parts[0].length / 2)),
        parts[0].slice(Math.ceil(parts[0].length / 2)),
        parts[1].slice(0, Math.ceil(parts[1].length / 2)),
        parts[1].slice(Math.ceil(parts[1].length / 2))
      ];
    } else if (parts.length === 3) {
      chunks = [
        parts[0],
        parts[1].slice(0, Math.ceil(parts[1].length / 2)),
        parts[1].slice(Math.ceil(parts[1].length / 2)),
        parts[2]
      ];
    }
  }

  if (chunks.length < 4) {
    const step = Math.ceil(clean.length / 4);
    chunks = [
      clean.slice(0, step),
      clean.slice(step, step * 2),
      clean.slice(step * 2, step * 3),
      clean.slice(step * 3)
    ].filter(c => c.length > 0);
  }

  if (chunks.length !== 4) return null;

  const labels = ['甲', '乙', '丙', '丁'];
  const originalCards = chunks.map((text, idx) => ({ text, origIdx: idx }));
  const shuffled = shuffleArray(originalCards);
  const labeledCards = shuffled.map((card, idx) => ({
    label: labels[idx],
    text: card.text,
    origIdx: card.origIdx
  }));

  const correctOrder = [0, 1, 2, 3].map(origIdx => {
    const found = labeledCards.find(c => c.origIdx === origIdx);
    return found ? found.label : '';
  }).join('');

  const distractorSet = new Set();
  while (distractorSet.size < 3) {
    const perm = shuffleArray([...labels]).join('');
    if (perm !== correctOrder) distractorSet.add(perm);
  }
  const options = shuffleArray([correctOrder, ...Array.from(distractorSet)]);

  return {
    ...item,
    quizType: 'unscramble',
    cleanSentence: clean,
    labeledCards,
    correctOrderLabels: correctOrder,
    options,
    correctAnswer: correctOrder
  };
}

function buildSentenceMimicQuestion(item) {
  let sentenceItem = (item && item.type === 'sentence') ? item : null;
  if (!sentenceItem) return null;
  return {
    ...sentenceItem,
    quizType: 'sentence',
    correctAnswer: sentenceItem.example || sentenceItem.title
  };
}

/**
 * 伺服端核心出題入口函式
 */
function getQuestions(params = {}) {
  const { rawBank, bankByType, textbookData } = loadDataSources();

  const press = params.press || 'none';
  const gradeSem = params.gradeSem || '3_1';
  const scope = params.scope || 'all';
  const targetScope = params.targetScope || 'all';
  const count = parseInt(params.count, 10) || 10;
  const mode = params.mode || null;

  let collected = [];
  const isTextbook = (press !== 'none' && textbookData && textbookData.curriculum && textbookData.curriculum[press]);
  let textbookPool = [];
  let tbGrade = '3';

  if (isTextbook) {
    const parts = gradeSem.split('_');
    tbGrade = parts[0] || '3';
    const sem = parts[1] || '1';

    const pData = textbookData.curriculum[press];
    if (pData && pData[tbGrade] && pData[tbGrade][sem]) {
      let lessons = pData[tbGrade][sem].lessons || [];
      if (scope === '1-4') lessons = lessons.filter(l => l.lessonNum >= 1 && l.lessonNum <= 4);
      else if (scope === '5-8') lessons = lessons.filter(l => l.lessonNum >= 5 && l.lessonNum <= 8);
      else if (scope === '9-12') lessons = lessons.filter(l => l.lessonNum >= 9 && l.lessonNum <= 12);

      const rawMap = new Map();
      rawBank.forEach(i => { if (i.word) rawMap.set(i.word, i); });

      lessons.forEach(l => {
        (l.words || []).forEach(w => {
          const m = rawMap.get(w.word);
          if (m) {
            textbookPool.push({ ...m, lessonNum: l.lessonNum, lessonTitle: l.lessonTitle, press });
          } else {
            let exMatch = (w.word.length >= 2 && w.desc) ? w.desc.match(/\[例\]([^。！？\n\r]+[。！？]?)/) : null;
            let ex = exMatch ? exMatch[1].trim() : '';
            let def = w.desc ? w.desc.replace(/\[例\].*$/, '').replace(/(?:如|例如)\s*[：:「].*$/, '').trim() : '';
            if (def && !/[。！？]$/.test(def)) def += '。';

            textbookPool.push({
              id: `tb-${l.academicYear}-${w.word}`,
              type: (w.word.length === 1) ? 'character' : (w.word.length === 4 ? 'idiom' : 'vocabulary'),
              category_name: `${press} 第${l.lessonNum}課`,
              word: w.word,
              title: w.word,
              zhuyin: '',
              definition: def || '課文生字語詞。',
              example: ex,
              lessonNum: l.lessonNum,
              lessonTitle: l.lessonTitle,
              press
            });
          }
        });
      });
    }
  }

  // 決定年級成語庫
  let gradeIdioms = bankByType.idiomMid;
  if (tbGrade === '1' || tbGrade === '2') gradeIdioms = bankByType.idiomLow;
  else if (tbGrade === '5' || tbGrade === '6') gradeIdioms = bankByType.idiomHigh;

  const activeMode = mode || targetScope;

  if (activeMode === 'zhuyin') {
    const cands = shuffleArray(bankByType.withZhuyin);
    for (let c of cands) {
      const q = buildZhuyinQuestion(c, bankByType.withZhuyin, rawBank);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'synonym') {
    const cands = shuffleArray(bankByType.withSynonyms);
    for (let c of cands) {
      const q = buildSynonymQuestion(c, rawBank, bankByType);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'situational') {
    const cands = shuffleArray(bankByType.idiom);
    for (let c of cands) {
      const q = buildSituationalQuestion(c, bankByType);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'conjunction' || activeMode === 'ellipsis') {
    const cands = shuffleArray(bankByType.ellipsis);
    for (let c of cands) {
      const q = buildConjunctionQuestion(c, bankByType);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'typo') {
    const cands = shuffleArray([...bankByType.idiom, ...bankByType.vocabulary]);
    for (let c of cands) {
      const q = buildTypoQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'unscramble') {
    const cands = shuffleArray([...bankByType.idiom, ...bankByType.vocabulary]);
    for (let c of cands) {
      const q = buildUnscrambleQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'sentence') {
    const cands = shuffleArray(bankByType.sentence);
    for (let c of cands) {
      const q = buildSentenceMimicQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'idiom_low') {
    const cands = shuffleArray(bankByType.idiomLow.length ? bankByType.idiomLow : bankByType.idiom);
    for (let c of cands) {
      const r = Math.random();
      let q = null;
      if (r < 0.4) q = buildClozeQuestion(c, bankByType.idiom, rawBank);
      else if (r < 0.7) q = buildSituationalQuestion(c, bankByType);
      else q = buildTypoQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'idiom_mid') {
    const cands = shuffleArray(bankByType.idiomMid.length ? bankByType.idiomMid : bankByType.idiom);
    for (let c of cands) {
      const r = Math.random();
      let q = null;
      if (r < 0.4) q = buildClozeQuestion(c, bankByType.idiom, rawBank);
      else if (r < 0.7) q = buildSituationalQuestion(c, bankByType);
      else q = buildTypoQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'idiom_high') {
    const cands = shuffleArray(bankByType.idiomHigh.length ? bankByType.idiomHigh : bankByType.idiom);
    for (let c of cands) {
      const r = Math.random();
      let q = null;
      if (r < 0.4) q = buildClozeQuestion(c, bankByType.idiom, rawBank);
      else if (r < 0.7) q = buildSituationalQuestion(c, bankByType);
      else q = buildTypoQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'idiom') {
    const cands = shuffleArray(bankByType.idiom);
    for (let c of cands) {
      const r = Math.random();
      let q = null;
      if (r < 0.4) q = buildClozeQuestion(c, bankByType.idiom, rawBank);
      else if (r < 0.7) q = buildSituationalQuestion(c, bankByType);
      else q = buildTypoQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'elementary') {
    const cands = shuffleArray([...bankByType.vocabulary, ...bankByType.sentence]);
    for (let c of cands) {
      let q = null;
      if (c.type === 'sentence') q = buildSentenceMimicQuestion(c);
      else if (Math.random() < 0.5) q = buildZhuyinQuestion(c, bankByType.withZhuyin, rawBank);
      else q = buildClozeQuestion(c, rawBank, rawBank);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (activeMode === 'junior_high') {
    const cands = shuffleArray([...bankByType.idiom, ...bankByType.ellipsis]);
    for (let c of cands) {
      let q = null;
      if (c.type === 'ellipsis') q = buildConjunctionQuestion(c, bankByType);
      else if (Math.random() < 0.5) q = buildSituationalQuestion(c, bankByType);
      else q = buildTypoQuestion(c);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  } else if (isTextbook && textbookPool.length > 0) {
    const tbShuffled = shuffleArray(textbookPool);
    const idiomShuffled = shuffleArray(gradeIdioms);
    let tIdx = 0, iIdx = 0;

    while (collected.length < count && (tIdx < tbShuffled.length || iIdx < idiomShuffled.length)) {
      const r = collected.length % 4;
      let q = null;
      if (r === 0 && tIdx < tbShuffled.length) {
        q = buildClozeQuestion(tbShuffled[tIdx++], textbookPool, rawBank);
      } else if (r === 1 && tIdx < tbShuffled.length) {
        const item = tbShuffled[tIdx++];
        if (!item.zhuyin) {
          const found = rawBank.find(r => r.word === item.word && r.zhuyin);
          if (found) item.zhuyin = found.zhuyin;
        }
        q = buildZhuyinQuestion(item, bankByType.withZhuyin, rawBank) || buildClozeQuestion(item, textbookPool, rawBank);
      } else if (r === 2 && tIdx < tbShuffled.length) {
        q = buildTypoQuestion(tbShuffled[tIdx++]) || buildClozeQuestion(tbShuffled[tIdx++], textbookPool, rawBank);
      } else if (r === 3 && iIdx < idiomShuffled.length) {
        q = buildClozeQuestion(idiomShuffled[iIdx++], bankByType.idiom, rawBank);
      }
      if (q) collected.push(q);
    }
  } else {
    // 全量題庫綜合出題模式
    const pool = shuffleArray(rawBank);
    for (let item of pool) {
      const r = Math.random();
      let q = null;
      if (r < 0.3) q = buildClozeQuestion(item, rawBank, rawBank);
      else if (r < 0.5) q = buildZhuyinQuestion(item, bankByType.withZhuyin, rawBank);
      else if (r < 0.7) q = buildTypoQuestion(item);
      else if (r < 0.85 && item.type === 'idiom') q = buildSituationalQuestion(item, bankByType);
      else if (item.synonyms) q = buildSynonymQuestion(item, rawBank, bankByType);
      else q = buildClozeQuestion(item, rawBank, rawBank);
      if (q) collected.push(q);
      if (collected.length >= count) break;
    }
  }

  // 100% 補齊保證
  let fIdx = 0;
  const fallbackList = shuffleArray(rawBank.length ? rawBank : bankByType.idiom);
  while (collected.length < count && fallbackList.length > 0) {
    const item = fallbackList[fIdx % fallbackList.length];
    const q = buildClozeQuestion(item, rawBank, rawBank);
    if (q) collected.push(q);
    fIdx++;
    if (fIdx > count * 3) break; // 防禦無限迴圈
  }

  return collected.slice(0, count);
}

/**
 * 題庫大字典搜尋
 */
function searchDictionary({ query = '', type = 'all', page = 1, limit = 24 }) {
  const { rawBank } = loadDataSources();
  const keyword = (query || '').trim().toLowerCase();

  const filtered = rawBank.filter(item => {
    if (type !== 'all' && item.type !== type) return false;
    if (!keyword) return true;
    const matchWord = (item.word || '').toLowerCase().includes(keyword);
    const matchZhuyin = (item.zhuyin || '').toLowerCase().includes(keyword);
    const matchDef = (item.definition || '').toLowerCase().includes(keyword);
    const matchEx = (item.example || '').toLowerCase().includes(keyword);
    return matchWord || matchZhuyin || matchDef || matchEx;
  });

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    total: filtered.length,
    page,
    limit,
    items
  };
}

module.exports = {
  loadDataSources,
  getQuestions,
  searchDictionary
};
