/**
 * 出題練習系統 - 前端核心邏輯 (app.js)
 * v3.0 旗艦版：全量 31,302 筆題庫
 * 支援 8 大核心題型：克漏字、錯字訂正、重組造句、國字注音、近義替換、情境成語、關聯詞複句、照樣仿寫
 * 嚴格保證出題題數 100% 精準對齊所選題數
 */

(function () {
  'use strict';

  // 全域題庫狀態
  let rawBank = [];
  let bankByType = {
    idiom: [],
    vocabulary: [],
    sentence: [],
    ellipsis: [],
    withSynonyms: [],
    withZhuyin: []
  };

  // 國小國中教育部標準易錯成語對照庫 (精準形音義對照)
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

  // 常見國語文字元級形音義易混淆字組庫
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
    '井': ['景'],
    '致': ['至', '智', '志'],
    '至': ['致', '志'],
    '辨': ['辯', '辮', '辦'],
    '辯': ['辨', '辮'],
    '截': ['接', '結'],
    '接': ['截', '結'],
    '再': ['在'],
    '在': ['再'],
    '度': ['渡'],
    '渡': ['度'],
    '宣': ['喧', '暄'],
    '喧': ['宣', '暄'],
    '蔚': ['慰', '衛'],
    '慰': ['蔚', '衛'],
    '滄': ['蒼', '艙'],
    '蒼': ['滄', '倉'],
    '券': ['卷', '圈'],
    '卷': ['券', '倦'],
    '聯': ['連', '蓮'],
    '連': ['聯', '廉'],
    '藉': ['借', '籍'],
    '借': ['藉', '階'],
    '副': ['幅', '福', '富'],
    '幅': ['副', '輻'],
    '馳': ['弛', '池', '持'],
    '弛': ['馳', '恥'],
    '濫': ['爛', '藍', '籃'],
    '爛': ['濫', '攬'],
    '璧': ['壁', '臂', '避'],
    '壁': ['璧', '畢'],
    '籌': ['愁', '綢', '仇'],
    '愁': ['籌', '仇'],
    '概': ['慨', '溉'],
    '慨': ['概', '凱'],
    '履': ['屢', '縷'],
    '屢': ['履', '縷'],
    '段': ['鍛', '斷'],
    '鍛': ['段', '斷'],
    '練': ['鍊', '戀'],
    '鍊': ['練', '連'],
    '甘': ['柑', '肝'],
    '柑': ['甘', '乾'],
    '迫': ['破', '魄'],
    '破': ['迫', '魄'],
    '名': ['明', '鳴', '銘'],
    '明': ['名', '鳴'],
    '班': ['般', '斑'],
    '般': ['班', '搬'],
    '抒': ['舒', '殊'],
    '舒': ['抒', '樞'],
    '煞': ['殺', '剎'],
    '殺': ['煞', '杉'],
    '促': ['蹙', '卒'],
    '蹙': ['促', '戚'],
    '悄': ['俏', '峭'],
    '俏': ['悄', '峭'],
    '按': ['安', '案'],
    '安': ['按', '岸'],
    '首': ['手', '守'],
    '手': ['首', '守'],
    '曲': ['屈', '趨'],
    '屈': ['曲', '趨'],
    '全': ['金', '泉'],
    '載': ['再', '在'],
    '璣': ['譏', '磯', '機'],
    '竽': ['魚', '芋'],
    '魚': ['竽', '漁'],
    '管': ['菅', '館'],
    '菅': ['管', '官'],
    '源': ['園', '原'],
    '園': ['源', '員'],
    '銘': ['名', '明', '鳴'],
    '尤': ['憂', '優'],
    '憂': ['尤', '悠'],
    '肓': ['盲', '忙'],
    '盲': ['肓', '芒'],
    '鋌': ['挺', '艇'],
    '挺': ['鋌', '庭'],
    '砭': ['貶', '邊'],
    '貶': ['砭', '扁'],
    '櫝': ['讀', '獨'],
    '讀': ['櫝', '瀆'],
    '輪': ['倫', '淪', '綸'],
    '倫': ['輪', '論'],
    '浹': ['夾', '頰'],
    '夾': ['浹', '狹'],
    '賅': ['該', '改'],
    '該': ['賅', '概'],
    '銷': ['消', '宵', '削'],
    '消': ['銷', '硝'],
    '杼': ['抒', '序'],
    '鵲': ['雀', '確'],
    '雀': ['鵲', '缺'],
    '斧': ['釜', '甫'],
    '釜': ['斧', '府'],
    '川': ['穿', '串'],
    '穿': ['川', '傳'],
    '脛': ['逕', '徑'],
    '逕': ['脛', '勁'],
    '騖': ['鶩', '務', '霧'],
    '鶩': ['騖', '霧', '誤'],
    '瑕': ['暇', '霞', '遐'],
    '暇': ['瑕', '霞', '遐'],
    '荼': ['茶', '涂'],
    '茶': ['荼', '查'],
    '裁': ['財', '材'],
    '徹': ['轍', '澈', '撤'],
    '轍': ['徹', '澈'],
    '飴': ['怡', '頤'],
    '怡': ['飴', '宜'],
    '噎': ['業', '夜'],
    '業': ['噎', '頁'],
    '萃': ['悴', '粹', '瘁'],
    '瘁': ['粹', '悴', '脆'],
    '益': ['意', '溢', '逸'],
    '意': ['益', '義', '議']
  };

  // 線上測驗狀態
  let currentQuizList = [];
  let currentQuizIndex = 0;
  let quizScore = 0;
  let quizStreak = 0;
  let quizCurrentMode = 'idiom';
  let unscrambleUserSlots = [];

  // 字典檢索狀態
  let dictFilteredList = [];
  let dictCurrentPage = 1;
  const DICT_PAGE_SIZE = 24;

  // DOM 元素快取
  const elements = {
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    totalWordCount: document.getElementById('totalWordCount'),

    // 教科書版本控制器
    textbookPressSelect: document.getElementById('textbookPressSelect'),
    textbookGradeGroup: document.getElementById('textbookGradeGroup'),
    textbookGradeSelect: document.getElementById('textbookGradeSelect'),
    textbookScopeGroup: document.getElementById('textbookScopeGroup'),
    textbookScopeSelect: document.getElementById('textbookScopeSelect'),

    // A4 試卷控制器
    paperTitleInput: document.getElementById('paperTitleInput'),
    paperSubtitleInput: document.getElementById('paperSubtitleInput'),
    targetScopeSelect: document.getElementById('targetScopeSelect'),
    questionCountSelect: document.getElementById('questionCountSelect'),
    layoutSelect: document.getElementById('layoutSelect'),
    chkShowZhuyin: document.getElementById('chkShowZhuyin'),
    chkShowHeaderBox: document.getElementById('chkShowHeaderBox'),
    chkIncludeAnswerKey: document.getElementById('chkIncludeAnswerKey'),
    chkShowMimicPattern: document.getElementById('chkShowMimicPattern'),
    btnGeneratePaper: document.getElementById('btnGeneratePaper'),
    btnPrintPaper: document.getElementById('btnPrintPaper'),

    // A4 預覽區
    displayPaperTitle: document.getElementById('displayPaperTitle'),
    displayPaperSubtitle: document.getElementById('displayPaperSubtitle'),
    displayAnswerSubtitle: document.getElementById('displayAnswerSubtitle'),
    studentInfoBox: document.getElementById('studentInfoBox'),
    displayMarks: document.getElementById('displayMarks'),
    printableQuestionsList: document.getElementById('printableQuestionsList'),
    printableAnswerKeyList: document.getElementById('printableAnswerKeyList'),
    answerKeyPage: document.getElementById('answerKeyPage'),

    // 線上測驗
    modeChips: document.querySelectorAll('.mode-chip'),
    quizProgress: document.getElementById('quizProgress'),
    quizScore: document.getElementById('quizScore'),
    quizStreak: document.getElementById('quizStreak'),
    btnRestartQuiz: document.getElementById('btnRestartQuiz'),
    quizCategoryBadge: document.getElementById('quizCategoryBadge'),
    quizTypeHint: document.getElementById('quizTypeHint'),
    quizQuestionPrompt: document.getElementById('quizQuestionPrompt'),
    quizPromptHint: document.getElementById('quizPromptHint'),
    quizOptionsContainer: document.getElementById('quizOptionsContainer'),
    quizUnscrambleContainer: document.getElementById('quizUnscrambleContainer'),
    traySlots: document.getElementById('traySlots'),
    btnResetUnscramble: document.getElementById('btnResetUnscramble'),
    unscrambleCardsGrid: document.getElementById('unscrambleCardsGrid'),
    btnSubmitUnscramble: document.getElementById('btnSubmitUnscramble'),
    quizWriteContainer: document.getElementById('quizWriteContainer'),
    txtUserWriting: document.getElementById('txtUserWriting'),
    btnShowWriteSample: document.getElementById('btnShowWriteSample'),
    quizExplanationBox: document.getElementById('quizExplanationBox'),
    quizResultStatus: document.getElementById('quizResultStatus'),
    quizCorrectAnswer: document.getElementById('quizCorrectAnswer'),
    quizFullExample: document.getElementById('quizFullExample'),
    quizDetailProps: document.getElementById('quizDetailProps'),
    btnNextQuestion: document.getElementById('btnNextQuestion'),

    // 字典檢索
    dictSearchInput: document.getElementById('dictSearchInput'),
    dictFilterType: document.getElementById('dictFilterType'),
    dictResultCount: document.getElementById('dictResultCount'),
    dictCardsList: document.getElementById('dictCardsList'),
    btnLoadMoreDict: document.getElementById('btnLoadMoreDict'),

    // 會員帳號系統
    btnUserAuth: document.getElementById('btnUserAuth'),
    userAvatarIcon: document.getElementById('userAvatarIcon'),
    userStatusText: document.getElementById('userStatusText'),
    modalAuth: document.getElementById('modalAuth'),
    btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
    tabAuthLogin: document.getElementById('tabAuthLogin'),
    tabAuthRegister: document.getElementById('tabAuthRegister'),
    btnQuickTeacher: document.getElementById('btnQuickTeacher'),
    btnQuickStudent: document.getElementById('btnQuickStudent'),
    btnQuickParent: document.getElementById('btnQuickParent'),
    formLogin: document.getElementById('formLogin'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    formRegister: document.getElementById('formRegister'),
    regRole: document.getElementById('regRole'),
    regUsername: document.getElementById('regUsername'),
    regPassword: document.getElementById('regPassword'),
    regRealName: document.getElementById('regRealName'),
    regSchool: document.getElementById('regSchool'),

    // 班級試卷碼與發布分享
    btnPublishExamCode: document.getElementById('btnPublishExamCode'),
    paperExamCodeStamp: document.getElementById('paperExamCodeStamp'),
    stampExamCodeText: document.getElementById('stampExamCodeText'),
    modalExamCode: document.getElementById('modalExamCode'),
    btnCloseExamCodeModal: document.getElementById('btnCloseExamCodeModal'),
    publishedCodeDisplay: document.getElementById('publishedCodeDisplay'),
    publishedTitleDisplay: document.getElementById('publishedTitleDisplay'),
    publishedShareUrl: document.getElementById('publishedShareUrl'),
    btnCopyShareUrl: document.getElementById('btnCopyShareUrl'),
    btnGoToTakeExam: document.getElementById('btnGoToTakeExam'),
    examQrCanvas: document.getElementById('examQrCanvas'),

    // 線上作答視圖 (exam-view)
    inputExamCode: document.getElementById('inputExamCode'),
    inputStudentName: document.getElementById('inputStudentName'),
    inputSeatNumber: document.getElementById('inputSeatNumber'),
    btnStartExamByCode: document.getElementById('btnStartExamByCode'),
    btnViewClassReport: document.getElementById('btnViewClassReport'),
    examRunnerContainer: document.getElementById('examRunnerContainer'),
    examRunnerCodeBadge: document.getElementById('examRunnerCodeBadge'),
    examRunnerTitle: document.getElementById('examRunnerTitle'),
    examRunnerSubtitle: document.getElementById('examRunnerSubtitle'),
    examTimerDisplay: document.getElementById('examTimerDisplay'),
    examQuestionsList: document.getElementById('examQuestionsList'),
    btnSubmitExamAnswers: document.getElementById('btnSubmitExamAnswers'),
    examResultCard: document.getElementById('examResultCard'),
    examFinalScore: document.getElementById('examFinalScore'),
    examScoreSummary: document.getElementById('examScoreSummary'),
    examMistakeNotice: document.getElementById('examMistakeNotice'),
    btnBackToExamEntry: document.getElementById('btnBackToExamEntry'),
    btnGoToLeaderboard: document.getElementById('btnGoToLeaderboard'),

    // 學習歷程與六維雷達圖 (history-view)
    statTotalExams: document.getElementById('statTotalExams'),
    statAvgScore: document.getElementById('statAvgScore'),
    statUnresolvedMistakes: document.getElementById('statUnresolvedMistakes'),
    statResolvedMistakes: document.getElementById('statResolvedMistakes'),
    radarChartCanvas: document.getElementById('radarChartCanvas'),
    historySubmissionsList: document.getElementById('historySubmissionsList'),
    filterMistakeAll: document.getElementById('filterMistakeAll'),
    filterMistakePending: document.getElementById('filterMistakePending'),
    filterMistakeResolved: document.getElementById('filterMistakeResolved'),
    mistakesListContainer: document.getElementById('mistakesListContainer'),
    leaderboardTableBody: document.getElementById('leaderboardTableBody'),
    modalRetest: document.getElementById('modalRetest'),
    btnCloseRetestModal: document.getElementById('btnCloseRetestModal'),
    retestModalBody: document.getElementById('retestModalBody'),

    // 教師線上協作成題 (collab-view)
    btnOpenCreateQuestion: document.getElementById('btnOpenCreateQuestion'),
    collabTotalCount: document.getElementById('collabTotalCount'),
    collabPendingCount: document.getElementById('collabPendingCount'),
    collabApprovedCount: document.getElementById('collabApprovedCount'),
    filterCollabAll: document.getElementById('filterCollabAll'),
    filterCollabPending: document.getElementById('filterCollabPending'),
    filterCollabApproved: document.getElementById('filterCollabApproved'),
    collabQuestionsContainer: document.getElementById('collabQuestionsContainer'),
    modalAddQuestion: document.getElementById('modalAddQuestion'),
    btnCloseAddQModal: document.getElementById('btnCloseAddQModal'),
    formAddCustomQuestion: document.getElementById('formAddCustomQuestion'),
    addQType: document.getElementById('addQType'),
    addQPress: document.getElementById('addQPress'),
    addQGrade: document.getElementById('addQGrade'),
    addQLesson: document.getElementById('addQLesson'),
    addQPrompt: document.getElementById('addQPrompt'),
    addQCorrectAns: document.getElementById('addQCorrectAns'),
    addQDistractors: document.getElementById('addQDistractors'),
    addQExplanation: document.getElementById('addQExplanation')
  };

  // 高品質即時啟動題庫 (保證頁面 0 毫秒秒開並立即呈現試卷，不需等待後台大數據)
  const STARTER_BANK = [
    { id: 's-1', type: 'idiom', category_name: '成語熟語', word: '守株待兔', title: '守株待兔', zhuyin: 'ㄕㄡˇ ㄓㄨ ㄉㄞˋ ㄊㄨˋ', definition: '比喻拘泥守舊，不知變通，妄想不勞而獲。', example: '做事要腳踏實地，如果只是守株待兔，終究不會有成果。', synonyms: '刻舟求劍', antonyms: '', template: '守株待兔', pattern: '守株待兔', difficulty: 'junior_high' },
    { id: 's-2', type: 'idiom', category_name: '成語熟語', word: '井底之蛙', title: '井底之蛙', zhuyin: 'ㄐㄧㄥˇ ㄉㄧˇ ㄓ ㄨㄚ', definition: '比喻見識狹窄、眼界狹小的人。', example: '我們應該多方學習、開拓視野，千萬不要成為自滿的井底之蛙。', synonyms: '目光短淺', antonyms: '見多識廣', template: '井底之蛙', pattern: '井底之蛙', difficulty: 'junior_high' },
    { id: 's-3', type: 'idiom', category_name: '成語熟語', word: '胸有成竹', title: '胸有成竹', zhuyin: 'ㄒㄩㄥ ㄧㄡˇ ㄔㄥˊ ㄓㄨˊ', definition: '比喻處事已具備完整計畫與充分把握。', example: '經過連日充分準備，他在上台報告前顯得胸有成竹。', synonyms: '心中有數', antonyms: '束手無策', template: '胸有成竹', pattern: '胸有成竹', difficulty: 'junior_high' },
    { id: 's-4', type: 'idiom', category_name: '成語熟語', word: '水落石出', title: '水落石出', zhuyin: 'ㄕㄨㄟˇ ㄌㄨㄛˋ ㄕˊ ㄔㄨ', definition: '比喻事情的真相完全顯露出來。', example: '經過警方的縝密調查，案情終於水落石出。', synonyms: '真相大白', antonyms: '撲朔迷離', template: '水落石出', pattern: '水落石出', difficulty: 'junior_high' },
    { id: 's-5', type: 'idiom', category_name: '成語熟語', word: '畫龍點睛', title: '畫龍點睛', zhuyin: 'ㄏㄨㄚˋ ㄌㄨㄥˊ ㄉㄧㄢˇ ㄐㄧㄥ', definition: '比喻在關鍵處加上精闢字句，使內容更加生動有力。', example: '這幅畫加上落日餘暉的色彩，真有畫龍點睛的奇妙效果。', synonyms: '錦上添花', antonyms: '畫蛇添足', template: '畫龍點睛', pattern: '畫龍點睛', difficulty: 'junior_high' },
    { id: 's-6', type: 'idiom', category_name: '成語熟語', word: '走馬看花', title: '走馬看花', zhuyin: 'ㄗㄡˇ ㄇㄚˇ ㄎㄢˋ ㄏㄨㄚ', definition: '比喻粗略瀏覽，未能深入了解事物精華。', example: '這座博物館館藏極為豐富，如果只是走馬看花實在大為可惜。', synonyms: '浮光掠影', antonyms: '觀察入微', template: '走馬看花', pattern: '走馬看花', difficulty: 'junior_high' },
    { id: 's-7', type: 'idiom', category_name: '成語熟語', word: '名副其實', title: '名副其實', zhuyin: 'ㄇㄧㄥˊ ㄈㄨˋ ㄑㄧˊ ㄕˊ', definition: '名聲或名稱與實質內容完全相符。', example: '他熱心助人且處事正直，是一位名副其實的優秀模範生。', synonyms: '名不虛傳', antonyms: '名不副實', template: '名副其實', pattern: '名副其實', difficulty: 'junior_high' },
    { id: 's-8', type: 'idiom', category_name: '成語熟語', word: '亡羊補牢', title: '亡羊補牢', zhuyin: 'ㄨㄤˊ ㄧㄤˊ ㄅㄨˇ ㄌㄠˊ', definition: '比喻犯錯或遭遇挫折後及時補救，尚可防患未然。', example: '現在發現錯誤還不算太晚，亡羊補牢猶未為晚。', synonyms: '及時補救', antonyms: '執迷不悟', template: '亡羊補牢', pattern: '亡羊補牢', difficulty: 'junior_high' },
    { id: 's-9', type: 'vocabulary', category_name: '國小國中常用語詞', word: '徘徊', title: '徘徊', zhuyin: 'ㄆㄞˊ ㄏㄨㄞˊ', definition: '在一個地方來回走動，或形容猶豫不決的樣子。', example: '他在校門口來回徘徊，不知道該如何向老師解釋遲到的原因。', synonyms: '盤桓', antonyms: '果決', template: '徘徊', pattern: '徘徊', difficulty: 'elementary' },
    { id: 's-10', type: 'vocabulary', category_name: '國小國中常用語詞', word: '謹慎', title: '謹慎', zhuyin: 'ㄐㄧㄣˇ ㄕㄣˋ', definition: '小心仔細，慎重不苟。', example: '處理重要文件時必須格外謹慎，以免發生錯誤。', synonyms: '小心', antonyms: '粗心', template: '謹慎', pattern: '謹慎', difficulty: 'elementary' },
    { id: 's-11', type: 'vocabulary', category_name: '國小國中常用語詞', word: '敏捷', title: '敏捷', zhuyin: 'ㄇㄧㄣˇ ㄐㄧㄝˊ', definition: '動作或思維靈敏迅速。', example: '獵豹以敏捷的身手在草原上奔馳追逐獵物。', synonyms: '靈活', antonyms: '遲鈍', template: '敏捷', pattern: '敏捷', difficulty: 'elementary' },
    { id: 's-12', type: 'vocabulary', category_name: '國小國中常用語詞', word: '吩咐', title: '吩咐', zhuyin: 'ㄈㄣ ㄈㄨˋ', definition: '口頭指派或囑託事情。', example: '媽媽出門前特地吩咐我要把客廳收拾乾淨。', synonyms: '叮囑', antonyms: '', template: '吩咐', pattern: '吩咐', difficulty: 'elementary' },
    { id: 's-13', type: 'vocabulary', category_name: '國小國中常用語詞', word: '謙虛', title: '謙虛', zhuyin: 'ㄑㄧㄢ ㄒㄩ', definition: '虛心不自誇，能聽取別人的意見。', example: '即使屢獲大獎，他依然保持謙虛待人的態度。', synonyms: '虛心', antonyms: '傲慢', template: '謙虛', pattern: '謙虛', difficulty: 'elementary' },
    { id: 's-14', type: 'vocabulary', category_name: '國小國中常用語詞', word: '沉思', title: '沉思', zhuyin: 'ㄔㄣˊ ㄙ', definition: '深切思考，專注冥想。', example: '面對難解的數學題目，他雙手托腮陷入了沉思。', synonyms: '深思', antonyms: '', template: '沉思', pattern: '沉思', difficulty: 'elementary' },
    { id: 's-15', type: 'vocabulary', category_name: '國小國中常用語詞', word: '燦爛', title: '燦爛', zhuyin: 'ㄘㄢˋ ㄌㄢˋ', definition: '形容光彩鮮明奪目，或笑容生動美好。', example: '夏日的夜空中綻放著燦爛奪目的煙火。', synonyms: '絢麗', antonyms: '黯淡', template: '燦爛', pattern: '燦爛', difficulty: 'elementary' },
    { id: 's-16', type: 'vocabulary', category_name: '國小國中常用語詞', word: '澎湃', title: '澎湃', zhuyin: 'ㄆㄥˊ ㄆㄞˋ', definition: '波浪相激撞擊的聲勢，比喻氣勢磅礡或情緒激動。', example: '聽完這場感人肺腑的演說，大家心中澎湃不已。', synonyms: '洶湧', antonyms: '平靜', template: '澎湃', pattern: '澎湃', difficulty: 'elementary' },
    { id: 's-17', type: 'sentence', category_name: '短語練習', word: '一面走路、一面吟誦', title: '一面走路、一面吟誦', zhuyin: '', definition: '並列動作短語練習', example: '一面走路、一面吟誦', synonyms: '', antonyms: '', template: '一面走路、一面吟誦', pattern: '一面走路、一面吟誦', difficulty: 'elementary' },
    { id: 's-18', type: 'sentence', category_name: '短語練習', word: '像樹枝般昂揚的鹿角', title: '像樹枝般昂揚的鹿角', zhuyin: '', definition: '比喻修飾短語練習', example: '像樹枝般昂揚的鹿角', synonyms: '', antonyms: '', template: '像樹枝般昂揚的鹿角', pattern: '像樹枝般昂揚的鹿角', difficulty: 'elementary' },
    { id: 's-19', type: 'sentence', category_name: '短語練習', word: '靜靜的看著星空', title: '靜靜的看著星空', zhuyin: '', definition: '副詞動作受詞短語練習', example: '靜靜的看著星空', synonyms: '', antonyms: '', template: '靜靜的看著星空', pattern: '靜靜的看著星空', difficulty: 'elementary' },
    { id: 's-20', type: 'sentence', category_name: '短語練習', word: '輕輕的微風吹拂著臉龐', title: '輕輕的微風吹拂著臉龐', zhuyin: '', definition: '形容詞主詞動作短語練習', example: '輕輕的微風吹拂著臉龐', synonyms: '', antonyms: '', template: '輕輕的微風吹拂著臉龐', pattern: '輕輕的微風吹拂著臉龐', difficulty: 'elementary' },
    { id: 's-21', type: 'ellipsis', category_name: '句型練習', word: '不僅有…和…還有…', title: '不僅有…和…還有…', zhuyin: '', definition: '遞進複句造句練習', example: '這次旅行不僅有美麗的風景和豐富的文化體驗，還有無數令人感動的回憶。', synonyms: '', antonyms: '', template: '不僅有…和…還有…', pattern: '不僅有…和…還有…', difficulty: 'junior_high' },
    { id: 's-22', type: 'ellipsis', category_name: '句型練習', word: '一方面…另一方面…', title: '一方面…另一方面…', zhuyin: '', definition: '並列複句造句練習', example: '他一方面希望能有更多時間休息，另一方面又擔心工作進度落後。', synonyms: '', antonyms: '', template: '一方面…另一方面…', pattern: '一方面…另一方面…', difficulty: 'junior_high' },
    { id: 's-23', type: 'ellipsis', category_name: '句型練習', word: '像…般…', title: '像…般…', zhuyin: '', definition: '比喻複句造句練習', example: '她的笑容像陽光般溫暖人心。', synonyms: '', antonyms: '', template: '像…般…', pattern: '像…般…', difficulty: 'junior_high' },
    { id: 's-24', type: 'ellipsis', category_name: '句型練習', word: '如果…還會…', title: '如果…還會…', zhuyin: '', definition: '假設遞進複句造句練習', example: '老師說如果我努力持續下去，就還會有更大的進步。', synonyms: '', antonyms: '', template: '如果…還會…', pattern: '如果…還會…', difficulty: 'junior_high' }
  ];

  // ============================================================================
  // 初始化與題庫載入 (採用秒開啟動 + 背景無縫載入全量題庫)
  // ============================================================================
  function initApp() {
    initTheme();
    bindEvents();
    initUserAuth();
    initExamModule();
    initHistoryModule();
    initCollabModule();
    checkUrlDeepLink();

    // 1. 0 毫秒極速啟動：立刻使用啟動題庫渲染頁面與試卷
    processBank(STARTER_BANK, false);

    // 2. 雲端環境偵測與自動秒級同步 (Vercel Serverless 高速引擎)
    if (window.location.protocol.startsWith('http')) {
      if (elements.totalWordCount) {
        elements.totalWordCount.textContent = '31,302 筆 (⚡ 雲端秒開)';
      }
      generateWorksheet();
      initDictSearch();
    } else {
      // 本機 file:/// 離線模式兜底
      loadFullBankBackground();
    }
  }

  function loadFullBankBackground() {
    let attempts = 0;
    const maxAttempts = 100; // 最多輪詢 15 秒

    const timer = setInterval(() => {
      attempts++;
      if (window.QUESTION_BANK_COMPACT && Array.isArray(window.QUESTION_BANK_COMPACT) && window.QUESTION_BANK_COMPACT.length > 0) {
        clearInterval(timer);
        unpackAndApplyFullBank(window.QUESTION_BANK_COMPACT);
      } else if (window.QUESTION_BANK && Array.isArray(window.QUESTION_BANK) && window.QUESTION_BANK.length > 0) {
        clearInterval(timer);
        processBank(window.QUESTION_BANK, true);
      } else if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.log('背景題庫載入超時，維持啟動題庫運作');
      }
    }, 150);
  }

  function unpackAndApplyFullBank(compactRows) {
    const typeMap = ['vocabulary', 'idiom', 'sentence', 'ellipsis'];
    const catNameMap = ['國小國中常用語詞', '成語熟語', '短語練習', '句型練習'];
    
    const unpacked = compactRows.map((rawRow, idx) => {
      const row = Array.isArray(rawRow) ? rawRow : (rawRow && rawRow.value ? rawRow.value : []);
      const tIdx = typeof row[0] === 'number' ? row[0] : 0;
      return {
        id: `item-${idx}`,
        type: typeMap[tIdx] || 'vocabulary',
        category_name: catNameMap[tIdx] || '國小國中常用語詞',
        word: row[1] || '',
        title: row[1] || '',
        zhuyin: row[2] || '',
        definition: row[3] || '',
        example: row[4] || '',
        synonyms: row[5] || '',
        antonyms: row[6] || '',
        template: row[7] || row[1] || '',
        pattern: row[7] || row[1] || '',
        difficulty: (tIdx === 1 || tIdx === 3) ? 'junior_high' : 'elementary'
      };
    });

    processBank(unpacked, true);
    console.log(`✅ 全量題庫已成功就緒：${unpacked.length} 筆資料`);
  }

  function processBank(data, isFullBank) {
    rawBank = data || [];
    bankByType = {
      idiom: rawBank.filter(i => i.type === 'idiom'),
      vocabulary: rawBank.filter(i => i.type === 'vocabulary'),
      sentence: rawBank.filter(i => i.type === 'sentence'),
      ellipsis: rawBank.filter(i => i.type === 'ellipsis'),
      withSynonyms: rawBank.filter(i => i.synonyms && i.synonyms.trim().length > 0),
      withZhuyin: rawBank.filter(i => i.zhuyin && i.zhuyin.trim().length > 0),
      idiomLow: [],
      idiomMid: [],
      idiomHigh: []
    };

    // 整合教育部官方 150 則國小低中高年級常用成語
    if (window.IDIOM_150_LIST && Array.isArray(window.IDIOM_150_LIST)) {
      const rawBankWordMap = new Map();
      rawBank.forEach(item => {
        if (item.word) rawBankWordMap.set(item.word, item);
      });

      window.IDIOM_150_LIST.forEach(item => {
        const matched = rawBankWordMap.get(item.word);
        const enrichedItem = matched ? {
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
          example: `平日寫作與說話時，若能適切引用「${item.word}」，能讓文意更加生動生輝。`,
          synonyms: '',
          antonyms: '',
          template: item.word,
          pattern: item.word,
          difficulty: (item.level === 'low') ? 'elementary' : 'junior_high',
          level: item.level,
          levelText: item.levelText
        };

        if (item.level === 'low') bankByType.idiomLow.push(enrichedItem);
        else if (item.level === 'mid') bankByType.idiomMid.push(enrichedItem);
        else if (item.level === 'high') bankByType.idiomHigh.push(enrichedItem);

        // 若題庫尚未收錄，無縫注入 rawBank 與 bankByType.idiom
        if (!matched) {
          rawBank.push(enrichedItem);
          bankByType.idiom.push(enrichedItem);
          if (enrichedItem.zhuyin) bankByType.withZhuyin.push(enrichedItem);
        }
      });
    }

    if (elements.totalWordCount) {
      elements.totalWordCount.textContent = rawBank.length.toLocaleString();
    }

    try {
      if (!isFullBank) {
        generateWorksheet();
        startNewQuizSession('idiom');
      }
      initDictSearch();
    } catch (err) {
      console.error('出題或初始化錯誤:', err);
    }
  }

  function initTheme() {
    const saved = localStorage.getItem('app-theme') || 'theme-light';
    document.body.className = saved;
    updateThemeIcon(saved);
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'theme-light' : 'theme-dark';
    document.body.className = newTheme;
    localStorage.setItem('app-theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const iconSpan = elements.btnThemeToggle.querySelector('.theme-icon');
    if (iconSpan) {
      iconSpan.textContent = theme === 'theme-dark' ? '☀️' : '🌙';
    }
  }

  function bindEvents() {
    elements.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.tabButtons.forEach(b => b.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const targetContent = document.getElementById(tabId);
        if (targetContent) targetContent.classList.add('active');

        if (tabId === 'history-view') {
          loadUserHistory();
          loadClassLeaderboard(elements.inputExamCode ? elements.inputExamCode.value : 'K3-8942');
        } else if (tabId === 'collab-view') {
          loadCollabQuestions();
        }
      });
    });

    elements.btnThemeToggle.addEventListener('click', toggleTheme);

    elements.btnGeneratePaper.addEventListener('click', generateWorksheet);
    elements.btnPrintPaper.addEventListener('click', () => window.print());

    // 教科書版本聯動事件
    if (elements.textbookPressSelect) {
      elements.textbookPressSelect.addEventListener('change', () => {
        const isTextbook = elements.textbookPressSelect.value !== 'none';
        if (elements.textbookGradeGroup) elements.textbookGradeGroup.style.display = isTextbook ? 'flex' : 'none';
        if (elements.textbookScopeGroup) elements.textbookScopeGroup.style.display = isTextbook ? 'flex' : 'none';
        updateTextbookHeaderInputs();
        generateWorksheet();
      });
    }
    if (elements.textbookGradeSelect) {
      elements.textbookGradeSelect.addEventListener('change', () => {
        updateTextbookHeaderInputs();
        generateWorksheet();
      });
    }
    if (elements.textbookScopeSelect) {
      elements.textbookScopeSelect.addEventListener('change', () => {
        updateTextbookHeaderInputs();
        generateWorksheet();
      });
    }

    elements.paperTitleInput.addEventListener('input', () => {
      elements.displayPaperTitle.textContent = elements.paperTitleInput.value || '國語文練習單';
    });
    elements.paperSubtitleInput.addEventListener('input', () => {
      elements.displayPaperSubtitle.textContent = elements.paperSubtitleInput.value || '';
      elements.displayAnswerSubtitle.textContent = elements.paperSubtitleInput.value ? `(${elements.paperSubtitleInput.value})` : '請由家長或教師進行批改';
    });
    elements.targetScopeSelect.addEventListener('change', generateWorksheet);
    elements.questionCountSelect.addEventListener('change', generateWorksheet);
    elements.layoutSelect.addEventListener('change', updateLayoutMode);
    elements.chkShowZhuyin.addEventListener('change', generateWorksheet);
    elements.chkShowHeaderBox.addEventListener('change', () => {
      elements.studentInfoBox.style.display = elements.chkShowHeaderBox.checked ? 'flex' : 'none';
    });
    elements.chkIncludeAnswerKey.addEventListener('change', () => {
      elements.answerKeyPage.style.display = elements.chkIncludeAnswerKey.checked ? 'flex' : 'none';
    });
    if (elements.chkShowMimicPattern) {
      elements.chkShowMimicPattern.addEventListener('change', generateWorksheet);
    }

    elements.modeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.modeChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        quizCurrentMode = chip.dataset.mode;
        startNewQuizSession(quizCurrentMode);
      });
    });

    elements.btnRestartQuiz.addEventListener('click', () => startNewQuizSession(quizCurrentMode));
    elements.btnNextQuestion.addEventListener('click', nextQuestion);
    elements.btnShowWriteSample.addEventListener('click', showWriteSample);
    elements.btnResetUnscramble.addEventListener('click', resetUnscrambleTray);
    elements.btnSubmitUnscramble.addEventListener('click', submitUnscrambleAnswer);

    elements.dictSearchInput.addEventListener('input', debounce(filterDictionary, 250));
    elements.dictFilterType.addEventListener('change', filterDictionary);
    elements.btnLoadMoreDict.addEventListener('click', loadMoreDictItems);
  }

  function updateLayoutMode() {
    const isDouble = elements.layoutSelect.value === 'double';
    if (isDouble) {
      elements.printableQuestionsList.classList.add('layout-double');
    } else {
      elements.printableQuestionsList.classList.remove('layout-double');
    }
  }

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

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * 格式化注音字串：
   * 1. 清除 HTML 雜質及附加備註 (如 /td>、相似詞等)
   * 2. 確保每個字的注音之間有清晰的「全形空格　」或顯著間隔隔開，利於學生辨認
   *    例："ㄉ｜ㄥˋ ㄕㄨ ㄐ｜" ➔ "ㄉ｜ㄥˋ　ㄕㄨ　ㄐ｜"
   *    若資料庫原為黏合無空格字串（如 "ㄉㄢˇㄑㄩㄝˋ" 或 "ㄉㄧㄥˋㄕㄨㄐㄧ"），亦能依聲韻調自動智慧切分並隔開
   */
  function formatZhuyin(rawZhuyin) {
    if (!rawZhuyin || typeof rawZhuyin !== 'string') return '';
    let clean = rawZhuyin
      .replace(/<[^>]+>/g, '')
      .replace(/\/td>.*$/i, '')
      .replace(/相似詞.*$/i, '')
      .replace(/反義詞.*$/i, '')
      .trim();

    if (!clean) return '';

    // 檢查是否已有空白隔開各字
    let parts = clean.split(/\s+/).filter(s => s.length > 0);

    // 若字串長度大於 2 且全部連在一起無空格（例如 ㄉㄢˇㄑㄩㄝˋ 或 ㄉㄧㄥˋㄕㄨㄐㄧ），依聲母與調號邊界智慧分詞
    if (parts.length === 1 && clean.length > 2) {
      const segmented = clean
        .replace(/([ˊˇˋ])([ㄅ-ㄙㄧㄨㄩ｜ㄚ-ㄦ])/g, '$1 $2')
        .replace(/([ㄧㄨㄩ｜ㄚ-ㄦ])(˙[ㄅ-ㄙㄧㄨㄩ｜ㄚ-ㄦ])/g, '$1 $2')
        .replace(/([ㄧㄨㄩ｜ㄚ-ㄦ])([ㄅ-ㄙ])/g, '$1 $2');
      parts = segmented.split(/\s+/).filter(s => s.length > 0);
    }

    // 每個字的注音以顯著的全形空格「　」隔開，極致清晰利於學生辨認
    return parts.join('　');
  }

  // ============================================================================
  // 8 大題型建構器 (Question Builders)
  // ============================================================================

  /**
   * 深入清洗字詞釋義與例句，嚴格杜絕題目洩漏解答：
   * 1. 提取隱藏在 definition 中的真實造句 (例如 "造句：故宮博物院典藏許多古代官家所藏的珍玩。")
   * 2. 徹底濾除釋義中的造句、引文出處（如「紅樓夢˙第五十二回...」）、書證例句
   * 3. 若目標字詞依然出現在釋義中，強制替換為掩碼「【　　】」，100% 保證題幹絕不出現答案
   */
  function sanitizeItemForQuestion(item) {
    if (!item) return { cleanExample: '', cleanDef: '' };
    const word = item.word || '';
    let ex = item.example || '';
    let def = item.definition || '';

    // 1. 如果原始 example 未包含目標詞，嘗試從 definition 的「造句：」或「例：」中提取
    if (!ex || !ex.includes(word)) {
      const m = def.match(/(?:造句|例句|如|例|§)\s*[:：]\s*([^。！？\n\r]+[。！？]?)/);
      if (m && m[1] && m[1].includes(word)) {
        ex = m[1].trim();
      }
    }

    // 2. 清除 definition 內的所有附帶造句、典籍引文、出處書證、別稱變體
    let cleanDef = def || '';
    cleanDef = cleanDef.split(/(?:語本|語出|語見|典出|書證|出處|亦作|或作|亦稱|參見|〔例|\[例|△)/)[0];
    cleanDef = cleanDef.split(/(?:造句|例句|如|例|§)\s*[:：]/)[0];
    cleanDef = cleanDef.replace(/(?:[，、；。]|\s+)?[\w\u4e00-\u9fa5〇○\d《》〈〉]{1,20}[·˙・].*$/g, '');
    cleanDef = cleanDef.replace(/^[\d\.\s、]+/g, '').trim();

    // 若清理後只剩標點或過短，保留原前段
    if (!cleanDef && def) {
      cleanDef = def.split(/[。！？\n]/)[0].trim();
    }

    // 確保結尾具備完整標點
    if (cleanDef && !/[。！？]$/.test(cleanDef)) {
      cleanDef += '。';
    }

    // 3. 嚴格遮罩：釋義中若有目標詞，一律換成「【　　】」
    if (word && cleanDef.includes(word)) {
      cleanDef = cleanDef.replace(new RegExp(word, 'g'), '【　　】');
    }

    // 4. 清理例句中的「造句：」前綴
    if (ex) {
      ex = ex.replace(/^(?:造句|例句|例|如)\s*[:：]\s*/, '').trim();
    }

    return { cleanExample: ex, cleanDef };
  }

  // 1. 克漏字選詞造句 (Cloze)
  function buildClozeQuestion(item) {
    if (!item || !item.word) return null;
    const { cleanExample, cleanDef } = sanitizeItemForQuestion(item);
    let maskedSentence = '';

    if (cleanExample && cleanExample.includes(item.word)) {
      maskedSentence = cleanExample.replace(item.word, '【　　　　】');
      if (!maskedSentence.startsWith('「') && !maskedSentence.includes('文句')) {
        maskedSentence = `「${maskedSentence}」文句中最適當填入的詞語是【　　　　】。`;
      }
    } else if (cleanDef) {
      maskedSentence = `下列詞語中，意思為「${cleanDef}」的是【　　　　】。`;
    } else {
      maskedSentence = `下列文句中，最適當填入的詞語是【　　　　】。`;
    }

    const pool = (item.type === 'idiom') ? bankByType.idiom : bankByType.vocabulary;
    const distractors = getRandomSample(pool.filter(i => i.word !== item.word), 3).map(i => i.word);
    const options = shuffleArray([item.word, ...distractors]);

    return {
      ...item,
      quizType: 'cloze',
      promptSentence: maskedSentence,
      options,
      correctAnswer: item.word
    };
  }

  // 2. 國字注音辨別題 (Zhuyin & Character Transcription)
  function buildZhuyinQuestion(item) {
    if (!item || !item.word || !item.zhuyin) return null;
    const formattedItemZhuyin = formatZhuyin(item.zhuyin);
    const isWriteChar = Math.random() > 0.5;

    if (isWriteChar) {
      // 看音寫國字
      let sentence = item.example || `請寫出「${item.word}」的國字。`;
      if (sentence.includes(item.word)) {
        sentence = sentence.replace(item.word, `（　　）[注音：${formattedItemZhuyin}]`);
      }
      const pool = (item.type === 'idiom') ? bankByType.idiom : bankByType.vocabulary;
      const distractors = getRandomSample(pool.filter(i => i.word !== item.word), 3).map(i => i.word);
      const options = shuffleArray([item.word, ...distractors]);

      return {
        ...item,
        quizType: 'zhuyin',
        subType: 'write_char',
        promptSentence: sentence,
        promptLabel: `【看音辨國字】（注音：${formattedItemZhuyin}）`,
        options,
        correctAnswer: item.word,
        handwriteHint: `國字填寫：（ ＿＿＿＿ ）`
      };
    } else {
      // 看字辨注音
      let sentence = item.example || `請辨別「${item.word}」的正確注音。`;
      if (sentence.includes(item.word)) {
        sentence = sentence.replace(item.word, `【${item.word}】`);
      }
      // 生成干擾注音 (抽其他詞條之注音，並經由 formatZhuyin 格式化)
      const distractors = getRandomSample(bankByType.withZhuyin.filter(i => i.zhuyin !== item.zhuyin), 3).map(i => formatZhuyin(i.zhuyin));
      const options = shuffleArray([formattedItemZhuyin, ...distractors]);

      return {
        ...item,
        quizType: 'zhuyin',
        subType: 'write_zhuyin',
        promptSentence: sentence,
        promptLabel: `【看字辨注音】請選出【${item.word}】的正確注音`,
        options,
        correctAnswer: formattedItemZhuyin,
        handwriteHint: `注音填寫：（ ＿＿＿＿ ）`
      };
    }
  }

  // 3. 近義詞替換與詞義辨析題 (Synonym Replacement)
  function buildSynonymQuestion(item) {
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

    let sentence = sourceItem.example || `他在文章中恰當地使用了「${sourceItem.word}」。`;
    if (sentence.includes(sourceItem.word)) {
      sentence = sentence.replace(sourceItem.word, `「${sourceItem.word}」`);
    } else {
      sentence = `「${sourceItem.word}」：${sentence}`;
    }

    const distractors = getRandomSample(
      rawBank.filter(i => i.word !== sourceItem.word && i.word !== correctSyn),
      3
    ).map(i => i.word);

    const options = shuffleArray([correctSyn, ...distractors]);

    return {
      ...sourceItem,
      quizType: 'synonym',
      promptSentence: `下列文句「　」中的詞語，替換為哪一個選項後，句子意思「最相近」？<br>「${sentence}」`,
      options,
      correctAnswer: correctSyn,
      targetWord: sourceItem.word,
      synonymWord: correctSyn
    };
  }

  function escapeRegExp(string) {
    return (string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  // 4. 成語/詞語生活情境素養題 (Situational)
  function buildSituationalQuestion(item) {
    let idiomItem = (item && item.type === 'idiom') ? item : getRandomSample(bankByType.idiom, 1)[0];
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

    const distractorPool = isIdiom ? bankByType.idiom : rawBank;
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

  // 5. 關聯詞複句邏輯選擇題 (Conjunction Logic)
  function buildConjunctionQuestion(item) {
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

  // 6. 造句錯字訂正 (Typo)
  function buildTypoQuestion(item) {
    if (!item || !item.word || !item.example) return null;
    // 錯字訂正選用真實成語或常用語詞，排除含刪節號之複句連詞，避免句型過長或格式不合
    if (item.type === 'ellipsis' || item.word.includes('…') || item.word.length > 6 || item.word.length < 2) return null;
    // 必須在真實例句中完整包含該詞條，以確保生成的句子自然流暢生動
    if (!item.example.includes(item.word)) return null;

    let targetChar = '';
    let typoChar = '';
    let charIdx = -1;
    let customDistractors = [];

    // 1. 優先匹配常考成語專用標準錯別字庫
    if (IDIOM_TYPO_MAP[item.word]) {
      const entry = IDIOM_TYPO_MAP[item.word];
      targetChar = entry.target;
      typoChar = entry.typo;
      customDistractors = entry.distractors || [];
      charIdx = item.word.indexOf(targetChar);
    } else {
      // 2. 搜尋詞條中是否含有國語文常考易錯字組
      const matchIndices = [];
      for (let i = 0; i < item.word.length; i++) {
        if (CHAR_TYPO_MAP[item.word[i]]) {
          matchIndices.push(i);
        }
      }
      if (matchIndices.length > 0) {
        charIdx = matchIndices[Math.floor(Math.random() * matchIndices.length)];
        targetChar = item.word[charIdx];
        const candidates = CHAR_TYPO_MAP[targetChar];
        typoChar = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // 🌟 核心防禦：若該詞條不含任何合理標準錯別字對照，嚴禁胡亂硬湊，直接放棄換抽下一題！
    if (!targetChar || !typoChar || charIdx < 0) return null;

    const typoWord = item.word.substring(0, charIdx) + typoChar + item.word.substring(charIdx + 1);
    const typoSentence = item.example.replace(item.word, typoWord);

    let distractors = [];
    if (customDistractors && customDistractors.length >= 2) {
      distractors = customDistractors.slice(0, 2);
    } else {
      const candidates = CHAR_TYPO_MAP[targetChar] ? CHAR_TYPO_MAP[targetChar].filter(c => c !== typoChar) : [];
      const fallbackList = ['容', '融', '榮', '提', '題', '步', '部', '厲', '利', '決', '絕', '全', '曲', '屈', '載', '再', '名', '明', '園', '源', '急', '及', '致', '至', '辨', '辯'].filter(c => c !== targetChar && c !== typoChar && !candidates.includes(c));
      const needed = 2 - candidates.length;
      distractors = [...candidates, ...(needed > 0 ? getRandomSample(fallbackList, needed) : [])].slice(0, 2);
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

  // 7. 重組造句 (Unscramble)
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

  // 8. 短語照樣造句 (Sentence Mimicry)
  function buildSentenceMimicQuestion(item) {
    let sentenceItem = (item && item.type === 'sentence') ? item : getRandomSample(bankByType.sentence, 1)[0];
    if (!sentenceItem) return null;
    return {
      ...sentenceItem,
      quizType: 'sentence',
      correctAnswer: sentenceItem.example || sentenceItem.title
    };
  }

  /**
   * 為短語照樣造句生成具體的「建議仿寫參考答案」與「句構語法特徵解析」
   * 確保解答券提供至少 1～3 個結構對齊、詞性對應且文意通順的示範答案供批改與學習
   */
  function getSentenceMimicGuidance(item) {
    const raw = (item.template || item.word || item.example || item.title || '').replace(/[。！?？]/g, '').trim();
    const clean = raw.replace(/[()（）]/g, '').trim();

    // 1. 精準對應庫 (涵蓋最核心、常見的課本經典短語)
    const EXACT_MAP = {
      '幽默且獨到的生活智慧': {
        structure: '（形容詞）且（形容詞）的（偏正名詞）',
        suggestions: ['溫和且堅定的處事態度', '豐富且多元的課外閱讀', '溫馨且難忘的童年回憶']
      },
      '一輪火紅的夕陽': {
        structure: '（數量詞）＋（形容詞）的（名詞）',
        suggestions: ['一抹湛藍的晴空', '一片金黃的麥浪', '一輪皎潔的明月']
      },
      '搖著荷葉上的水': {
        structure: '（動詞）著（名詞）上的（名詞）',
        suggestions: ['望著窗台上的花', '數著夜空中的星', '撫著琴弦上的音']
      },
      '一面走路、一面吟誦': {
        structure: '並列動作句構：一面（動作）、一面（動作）',
        suggestions: ['一邊彈琴、一邊歌唱', '時而漫步、時而沉思', '一邊觀察、一邊記錄']
      },
      '像樹枝般昂揚的鹿角': {
        structure: '比喻句構：像（名詞）般（形容詞）的（名詞）',
        suggestions: ['像水晶般清澈的湖水', '像羽毛般輕盈的雪花', '像黃金般燦爛的陽光']
      },
      '我的世界安安靜靜、黑黑暗暗': {
        structure: '（名詞）＋ AABB 重疊狀態詞、AABB 重疊狀態詞',
        suggestions: ['他的歌聲清清脆脆、甜甜美美', '秋天的田野金金黃黃、豐豐盈盈', '校園的早晨熱熱鬧鬧、開開心心']
      },
      '臉色一陣紅一陣白': {
        structure: '（名詞）＋ 一陣（形容詞）一陣（形容詞）',
        suggestions: ['心情一陣喜一陣憂', '微風一陣涼一陣暖', '琴聲一陣急一陣緩']
      },
      '敏銳而有智慧的人': {
        structure: '（形容詞）而（形容詞/偏正）的（名詞）',
        suggestions: ['勤奮而有毅力的學者', '勇敢而有擔當的青年', '溫暖而有力量的雙手']
      },
      '滾滾的洪水': {
        structure: '（疊字形容詞）的（名詞）',
        suggestions: ['滔滔的江水', '蔚藍的大海', '漫漫的長夜']
      },
      '激發自己的潛能': {
        structure: '（動詞）＋（代詞/名詞）的（名詞）',
        suggestions: ['實現心中的夢想', '充實課餘的生活', '展現團隊的默契']
      },
      '一回又一回的篇章': {
        structure: '一（量詞）又一（量詞）的（名詞）',
        suggestions: ['一次又一次的挑戰', '一波又一波的浪潮', '一步又一步的堅持']
      },
      '滿樹的紅黃錯落': {
        structure: '滿（名詞）的（形容詞/四字狀態詞）',
        suggestions: ['滿地的落英繽紛', '滿天的繁星閃爍', '滿園的花香四溢']
      },
      '日日夜夜望著天空': {
        structure: '（時間重疊詞）＋（動詞）著（名詞）',
        suggestions: ['歲歲年年盼著故鄉', '朝朝暮暮守著家園', '時時刻刻念著師恩']
      },
      '滿山都是綠油油的森林': {
        structure: '（處所詞）都是（疊字狀態詞）的（名詞）',
        suggestions: ['遍地都是金燦燦的落葉', '整座都是香噴噴的花海', '湖面都是藍汪汪的波光']
      },
      '沉入深深的海底': {
        structure: '（動態趨向詞）＋（疊字形容詞）的（名詞）',
        suggestions: ['飛向高高的晴空', '走入靜靜的密林', '奔向寬寬的草原']
      },
      '讓樹木一棵棵成長': {
        structure: '讓（名詞）一（量詞疊字）（動詞）',
        suggestions: ['讓幼苗一株株茁壯', '讓夢想一步步實現', '讓友誼一天天加深']
      },
      '聞一聞葉片的氣味': {
        structure: '（動詞）一（動詞）＋（名詞）的（名詞）',
        suggestions: ['看一看天邊的彩霞', '聽一聽林間的鳥鳴', '嚐一嚐鮮果的滋味']
      },
      '為了得到更好的答案': {
        structure: '為了（動詞）更（形容詞）的（名詞）',
        suggestions: ['為了追求更卓越的表現', '為了創造更美好的明天', '為了守護更珍貴的友誼']
      },
      '踏上尋夢的旅程': {
        structure: '（動詞）＋（動賓/偏正）的（名詞）',
        suggestions: ['揚起希望的風帆', '點亮智慧的明燈', '翻開歷史的篇章']
      },
      '靜靜的看著星空': {
        structure: '（疊字副詞）的（動詞）著（名詞）',
        suggestions: ['悄悄的走進教室', '輕輕的撫摸花瓣', '默默的許下心願']
      },
      '輕輕的微風吹拂著臉龐': {
        structure: '（疊字形容詞）的（名詞）＋（動詞）著（名詞）',
        suggestions: ['溫暖的陽光灑落在大地', '清涼的雨滴滋潤著花草', '柔和的月光照耀著湖面']
      }
    };

    if (EXACT_MAP[clean]) {
      return EXACT_MAP[clean];
    }
    for (let k in EXACT_MAP) {
      if (clean.includes(k) || k.includes(clean)) {
        return EXACT_MAP[k];
      }
    }

    // 2. 複句句構推論引擎 (含逗號/頓號分句，確保前後分句字數、對稱與語氣連貫)
    if (clean.includes('，') || clean.includes(',')) {
      // 2a. 時間對比複句: 當...漸漸...，...卻...
      if (clean.startsWith('當') && clean.includes('卻')) {
        return {
          structure: '時間對比複句：當（主詞）漸漸（狀態/動作），（主詞）卻逐一（動作/狀態）',
          suggestions: [
            '當大地漸漸復甦甦醒，寒雪卻逐一融化',
            '當朝陽漸漸驅散濃霧，晨星卻逐一隱沒',
            '當春風漸漸拂暖大地，冬霜卻逐一消逝'
          ]
        };
      }
      if (clean.startsWith('當') && (clean.includes('時') || clean.includes('就'))) {
        return {
          structure: '時間承接複句：當（事件/狀態）時，（動作/後果）',
          suggestions: [
            '當微風吹拂大地時，群花紛紛綻放笑靨',
            '當夜幕籠罩大地時，星辰悄悄點亮夜空',
            '當陽光灑落林梢時，鳥兒歡快啼唱晨曦'
          ]
        };
      }
      // 2b. 比喻排比複句: ...像...、像...
      if (clean.includes('像') && (clean.includes('、') || clean.split('像').length > 2)) {
        return {
          structure: '比喻排比複句：（事物），像（比喻一）、像（比喻二），（動態描摹）',
          suggestions: [
            '雪，像白羽、像棉絮，輕輕的漫天飛舞',
            '雲，像綿羊、像棉花，自在的漫步晴空',
            '露珠，像水晶、像珍珠，晶瑩的凝於草梢'
          ]
        };
      }
      // 2c. 承接感悟複句: ...讓人不得不... / ...令人不得不...
      if (clean.includes('讓') && clean.includes('不得不')) {
        return {
          structure: '因果感悟複句：（前情景致），讓人不得不（雙音節動作）（動作態勢）',
          suggestions: [
            '微風送來陣陣花香，讓人不得不放慢腳步細細品味',
            '眼前展現浩瀚山川，讓人不得不心生讚嘆肅然起敬',
            '美景令人心馳神往，讓人不得不駐足凝望流連忘返'
          ]
        };
      }
      // 2d. 比喻描摹複句: ...好像... / ...猶如... / ...有如...
      if (clean.includes('好像') || clean.includes('猶如') || clean.includes('有如')) {
        return {
          structure: '情境比喻複句：（景致描摹），好像（比喻情境）',
          suggestions: [
            '彎彎的月兒掛在天上，好像一隻金色的小船',
            '平靜的湖面映著青山，猶如一面明淨的碧玉',
            '滿天的繁星閃爍光芒，有如落入夜空的碎鑽'
          ]
        };
      }
      // 2e. 通用對稱複句仿寫保底
      return {
        structure: '對稱複句仿寫：（前句描摹景況），（後句敘寫動態或感懷）',
        suggestions: [
          '清風拂面心舒暢，鳥語花香意盎然',
          '朝陽灑落林間暖，晨露晶瑩草木青',
          '春雨綿綿潤萬物，秋風瑟瑟染霜林'
        ]
      };
    }

    // 3. 智慧短語句構推論引擎 (單句與短語，依文法嚴格對齊)
    // 3a. 使動疊代短語: 讓...一...又一... (如 讓觀眾經歷一場又一場的冒險)
    if (clean.includes('讓') && (clean.includes('又一') || clean.includes('又'))) {
      return {
        structure: '使動疊代句構：讓（對象）（動作）一（量詞）又一（量詞）的（名詞）',
        suggestions: [
          '讓讀者感受一次又一次的感動',
          '讓學子跨越一個又一個的難關',
          '讓選手迎接一場又一場的挑戰'
        ]
      };
    }

    // 3b. 時態動賓短語: ...了... (如 面臨了諸多挑戰, 拉近了人與人之間的距離)
    if (clean.includes('了') && clean.length <= 14) {
      if (clean.includes('人與人') || clean.includes('之間')) {
        return {
          structure: '動態關聯句構：（動詞）了（名詞）與（名詞）之間的（名詞）',
          suggestions: [
            '搭起了心靈與心靈之間的橋梁',
            '增進了老師與學生之間的感情',
            '化解了彼此與彼此之間的誤會'
          ]
        };
      }
      return {
        structure: '時態動賓句構：（雙音節動詞）了（修飾語＋名詞）',
        suggestions: [
          '克服了重重困難',
          '累積了豐富經驗',
          '化解了許多危機',
          '經歷了無數考驗'
        ]
      };
    }

    // 3c. 程度補語句構: ...得... (如 感動得淚如雨下, 笑得合不攏嘴)
    if (clean.includes('得')) {
      return {
        structure: '程度補語句構：（動詞/形容詞）得（補語/四字成語）',
        suggestions: [
          '感動得熱淚盈眶',
          '高興得手舞足蹈',
          '急得滿頭大汗',
          '笑得合不攏嘴'
        ]
      };
    }

    // 3d. 比喻修飾短語: 像...般... / 猶如...般... / 像...一樣... / ...像...
    if (clean.includes('像') || clean.includes('猶如') || clean.includes('有如') || clean.includes('好似')) {
      if (clean.includes('般') || clean.includes('一樣') || clean.includes('那樣')) {
        return {
          structure: '比喻修飾句構：像（名詞）般（形容詞）的（名詞）',
          suggestions: [
            '像水晶般清澈的湖水',
            '像羽毛般輕盈的雪花',
            '像明鏡般平靜的湖面'
          ]
        };
      }
      return {
        structure: '本體喻體比喻句：（名詞）像（形容詞）的（名詞）',
        suggestions: [
          '真摯的友誼像溫暖的春風',
          '老師的教誨像明燈指引方向',
          '母親的慈愛像溫煦的陽光'
        ]
      };
    }

    // 3e. 時空延展句構: 從...到...
    if (clean.includes('從') && clean.includes('到')) {
      return {
        structure: '時空延展句構：從（起點）到（終點）',
        suggestions: [
          '從清晨到黃昏',
          '從高山到大海',
          '從陌生到熟悉'
        ]
      };
    }

    // 3f. 判斷比喻肯定句: ...是...
    if (clean.includes('是')) {
      return {
        structure: '比喻肯定句構：（事物）是（數量詞/修飾語）（賓語）',
        suggestions: [
          '知識是航向未來的羅盤',
          '童年是一幅斑斕的畫卷',
          '書籍是通往智慧的階梯'
        ]
      };
    }

    // 3g. 動作感官重疊: (動)一(動)...的... (嚴格限定首字與第三字相同且次字為「一」，如 看一看、聽一聽、聞一聞)
    if (clean.length >= 4 && clean[1] === '一' && clean[0] === clean[2] && clean.includes('的')) {
      return {
        structure: '動作感官句構：（動詞）一（動詞）＋（名詞）的（名詞）',
        suggestions: [
          '看一看天邊的彩霞',
          '聽一聽林間的鳥鳴',
          '嚐一嚐鮮果的滋味',
          '品一品茶湯的芬芳'
        ]
      };
    }

    // 3h. 數量疊字修飾: 一[量量]...的... (如 一枝枝修長平順的稜骨，限定 clean[1] === clean[2])
    if (clean.length >= 4 && clean[0] === '一' && clean[1] === clean[2] && clean.includes('的')) {
      return {
        structure: '數量疊字句構：一（量詞疊字）（四字形容詞）的（名詞）',
        suggestions: [
          '一朵朵嬌豔美麗的花朵',
          '一顆顆晶瑩剔透的露珠',
          '一片片金黃耀眼的落葉'
        ]
      };
    }

    // 3i. 數量疊代修飾: 一(量)又一(量)的(名詞)
    if ((clean.includes('又一') || clean.includes('又')) && clean.includes('的')) {
      return {
        structure: '數量疊代句構：一（量詞）又一（量詞）的（名詞）',
        suggestions: [
          '一次又一次的挑戰',
          '一波又一波的浪潮',
          '一步又一步的堅持'
        ]
      };
    }

    // 3j. 趨向動賓短語: ...出...的... (如 展現出無比的勇氣, 寫出動人的故事，限定 出 在 的 之前)
    if (clean.includes('出') && clean.includes('的') && clean.indexOf('出') < clean.indexOf('的')) {
      return {
        structure: '趨向動賓句構：（動詞）出（形容詞）的（名詞）',
        suggestions: [
          '綻放出燦爛的笑容',
          '散發出迷人的芬芳',
          '譜寫出動人的樂章'
        ]
      };
    }

    // 3k. 動態空間方位: ...著...[上/下/中/裡/間]的...
    if (clean.includes('著') && (clean.includes('上') || clean.includes('下') || clean.includes('中') || clean.includes('裡') || clean.includes('間'))) {
      return {
        structure: '動態空間句構：（動詞）著（處所詞）的（名詞）',
        suggestions: [
          '望著窗台上的鮮花',
          '數著夜空中的繁星',
          '撫著琴弦上的旋律'
        ]
      };
    }

    // 3l. 伴隨動態句構: ...著...
    if (clean.includes('著')) {
      return {
        structure: '伴隨動態句構：（動詞）著（形容詞/名詞）',
        suggestions: [
          '懷著感恩的心情',
          '迎著溫暖的微風',
          '帶著自信的笑容'
        ]
      };
    }

    // 3m. 目的短語: 為了...更...
    if (clean.includes('為了') && clean.includes('更')) {
      return {
        structure: '目的句構：為了（動詞）更（形容詞）的（名詞）',
        suggestions: [
          '為了追求更卓越的表現',
          '為了創造更美好的明天',
          '為了守護更珍貴的友誼'
        ]
      };
    }

    // 3n. 全景存在句構: ...都是... / ...滿是...
    if ((clean.includes('都是') || clean.includes('滿是')) && clean.includes('的')) {
      return {
        structure: '全景描摹句構：（處所詞）都是（疊字狀態詞）的（名詞）',
        suggestions: [
          '遍地都是金燦燦的落葉',
          '整座都是香噴噴的花海',
          '湖面都是藍汪汪的波光'
        ]
      };
    }

    // 3o. 使動發展句構: 讓...
    if (clean.includes('讓')) {
      return {
        structure: '使動發展句構：讓（名詞）（副詞/量詞）（動詞）',
        suggestions: [
          '讓幼苗一株株茁壯',
          '讓夢想一步步實現',
          '讓友誼一天天加深'
        ]
      };
    }

    // 3p. 並列修飾句構: ...且...的...
    if (clean.includes('且') && clean.includes('的')) {
      return {
        structure: '並列修飾句構：（形容詞）且（形容詞）的（名詞）',
        suggestions: [
          '溫和且堅定的處事態度',
          '豐富且多元的課外閱讀',
          '誠懇且真摯的友誼連結'
        ]
      };
    }

    // 3q. 遞進修飾句構: ...而...的...
    if (clean.includes('而') && clean.includes('的')) {
      return {
        structure: '遞進修飾句構：（形容詞）而（有偏正/形容詞）的（名詞）',
        suggestions: [
          '勤奮而有毅力的學者',
          '深奧而有哲理的故事',
          '簡約而有質感的佈置'
        ]
      };
    }

    // 3r. 介賓處所句構: 在...[中/下/間/上/裡]...
    if (clean.startsWith('在') && (clean.includes('中') || clean.includes('下') || clean.includes('間') || clean.includes('上') || clean.includes('裡'))) {
      return {
        structure: '介賓處所句構：在（處所詞）＋（副詞/形容詞）（動詞）',
        suggestions: [
          '在山林間自在奔跑',
          '在陽光下閃閃發光',
          '在微風中輕輕搖曳'
        ]
      };
    }

    // 3s. 偏正結構: ...的...
    if (clean.includes('的')) {
      const parts = clean.split('的');
      const mod = parts[0];
      
      // 疊字形容詞偏正: 滾滾的洪水, 蔚藍的大海
      if (mod.length === 2 && mod[0] === mod[1]) {
        return {
          structure: '疊字偏正句構：（疊字形容詞）的（雙音節名詞）',
          suggestions: ['滔滔的江水', '漫漫的長夜', '冉冉的朝陽']
        };
      }
      // 雙音節形容詞偏正: 蒼翠的山嶺, 有趣的繞口令
      if (mod.length <= 3) {
        return {
          structure: '形容詞偏正句構：（雙音節形容詞）的（雙音節名詞）',
          suggestions: ['蔚藍的晴空', '清澈的溪流', '皎潔的月光']
        };
      }
      // 多音節/動賓偏正: 激發自己的潛能, 踏上尋夢的旅程
      return {
        structure: '動賓偏正句構：（動賓/修飾語）的（中心名詞）',
        suggestions: ['實現心中的夢想', '揚起希望的風帆', '翻開歷史的篇章']
      };
    }

    // 3t. 動賓短語: (動詞)＋(名詞) (無「的」無逗號)
    if (clean.length <= 4) {
      return {
        structure: '雙音節動賓短語：（動詞）＋（名詞）',
        suggestions: ['綻放笑容', '揮灑汗水', '追逐夢想']
      };
    } else {
      return {
        structure: '動賓連動短語：（副詞/狀語）＋（動詞）＋（名詞）',
        suggestions: ['認真翻找書本', '默默許下心願', '勇敢迎接挑戰']
      };
    }
  }

  // ============================================================================
  // 教科書最新年度課綱查詢與標題智慧同步 (Kang Hsuan, Nan Yi, Han Lin)
  // ============================================================================
  function getTextbookActiveLessons(press, gradeSem, scope) {
    if (!window.TEXTBOOK_DATA || !window.TEXTBOOK_DATA.curriculum) return null;
    const parts = (gradeSem || '3_1').split('_');
    const grade = parts[0] || '3';
    const sem = parts[1] || '1';

    const pressData = window.TEXTBOOK_DATA.curriculum[press];
    if (!pressData || !pressData[grade] || !pressData[grade][sem]) return null;

    const gradeData = pressData[grade][sem];
    const latestYear = gradeData.latestYear || 115;
    let lessons = gradeData.lessons || [];

    if (scope === '1-4') {
      lessons = lessons.filter(l => l.lessonNum >= 1 && l.lessonNum <= 4);
    } else if (scope === '5-8') {
      lessons = lessons.filter(l => l.lessonNum >= 5 && l.lessonNum <= 8);
    } else if (scope === '9-12') {
      lessons = lessons.filter(l => l.lessonNum >= 9 && l.lessonNum <= 12);
    }

    return {
      press,
      grade,
      semester: sem,
      latestYear,
      lessons
    };
  }

  function updateTextbookHeaderInputs() {
    if (!elements.textbookPressSelect) return;
    const press = elements.textbookPressSelect.value;
    if (press === 'none') {
      elements.paperTitleInput.value = '國語文造句、成語挑戰與素養練習單';
      elements.paperSubtitleInput.value = '詞彙理解・錯字訂正・重組造句・國字注音・素養命題評量';
      elements.displayPaperTitle.textContent = elements.paperTitleInput.value;
      elements.displayPaperSubtitle.textContent = elements.paperSubtitleInput.value;
      elements.displayAnswerSubtitle.textContent = '請由家長或教師進行批改';
      return;
    }

    const gradeSem = elements.textbookGradeSelect ? elements.textbookGradeSelect.value : '3_1';
    const parts = gradeSem.split('_');
    const grade = parts[0] || '3';
    const sem = parts[1] || '1';
    const scope = elements.textbookScopeSelect ? elements.textbookScopeSelect.value : 'all';

    const numToChinese = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六' };
    const gradeText = `${numToChinese[grade] || grade}年級${sem === '1' ? '上' : '下'}學期`;

    const scopeNames = {
      'all': '全冊課文總複習',
      '1-4': '第 1～4 課（第一次段考）',
      '5-8': '第 5～8 課（第二次段考）',
      '9-12': '第 9～12 課（期末評量）'
    };
    const scopeText = scopeNames[scope] || '全冊課文';

    let latestYear = 115;
    if (window.TEXTBOOK_DATA && window.TEXTBOOK_DATA.curriculum && window.TEXTBOOK_DATA.curriculum[press] && window.TEXTBOOK_DATA.curriculum[press][grade] && window.TEXTBOOK_DATA.curriculum[press][grade][sem]) {
      latestYear = window.TEXTBOOK_DATA.curriculum[press][grade][sem].latestYear || 115;
    }

    elements.paperTitleInput.value = `${press}國語 ${gradeText} 課堂學習評量卷`;
    elements.paperSubtitleInput.value = `【最新 ${latestYear} 學年度課綱・${scopeText}】生字生詞、成語挑戰與素養評量`;
    elements.displayPaperTitle.textContent = elements.paperTitleInput.value;
    elements.displayPaperSubtitle.textContent = elements.paperSubtitleInput.value;
    elements.displayAnswerSubtitle.textContent = `(${elements.paperSubtitleInput.value})`;
  }

  // ============================================================================
  // 核心功能 1: A4 練習券出卷產生引擎 (保證 100% 題數相符)
  // ============================================================================
  async function generateWorksheet() {
    const targetCount = parseInt(elements.questionCountSelect.value, 10) || 10;
    const scope = elements.targetScopeSelect.value;
    const showZhuyin = elements.chkShowZhuyin.checked;

    elements.displayPaperTitle.textContent = elements.paperTitleInput.value || '國語文造句與成語練習單';
    elements.displayPaperSubtitle.textContent = elements.paperSubtitleInput.value || '';
    elements.displayMarks.textContent = `總題數：${targetCount} 題 (滿分 100 分，每題 ${Math.floor(100 / targetCount)} 分)`;

    const press = elements.textbookPressSelect ? elements.textbookPressSelect.value : 'none';
    const gradeSem = elements.textbookGradeSelect ? elements.textbookGradeSelect.value : '3_1';
    const tbScope = elements.textbookScopeSelect ? elements.textbookScopeSelect.value : 'all';

    // 🌟 雲端極速 Serverless 出題引擎 (抗高並發、秒級響應 ~3KB 精簡 JSON)
    if (window.location.protocol.startsWith('http')) {
      try {
        const apiUrl = `/api/quiz?press=${encodeURIComponent(press)}&gradeSem=${encodeURIComponent(gradeSem)}&scope=${encodeURIComponent(tbScope)}&targetScope=${encodeURIComponent(scope)}&count=${targetCount}`;
        const resp = await fetch(apiUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
            renderPaperQuestions(data.questions, showZhuyin);
            renderAnswerKey(data.questions);
            return;
          }
        }
      } catch (err) {
        console.warn('雲端 API 出題失敗，自動降級本機引擎：', err);
      }
    }

    if (rawBank.length === 0) return;

    const collectedQuestions = [];
    const isTextbookMode = press !== 'none';
    let textbookPool = [];
    let textbookInfo = null;

    if (isTextbookMode) {
      const gradeSem = elements.textbookGradeSelect ? elements.textbookGradeSelect.value : '3_1';
      const tbScope = elements.textbookScopeSelect ? elements.textbookScopeSelect.value : 'all';
      textbookInfo = getTextbookActiveLessons(press, gradeSem, tbScope);

      if (textbookInfo && textbookInfo.lessons && textbookInfo.lessons.length > 0) {
        const rawMap = new Map();
        rawBank.forEach(item => {
          if (item.word) rawMap.set(item.word, item);
        });

        textbookInfo.lessons.forEach(lesson => {
          (lesson.words || []).forEach(wObj => {
            const matched = rawMap.get(wObj.word);
            if (matched) {
              textbookPool.push({
                ...matched,
                lessonNum: lesson.lessonNum,
                lessonTitle: lesson.lessonTitle,
                academicYear: lesson.academicYear,
                press: press
              });
            } else {
              // 課本原生詞彙轉換
              let ex = '';
              let def = wObj.desc || '';
              const exMatch = def.match(/\[例\]([^。！？\n\r]+[。！？]?)/);
              if (exMatch) {
                ex = exMatch[1].trim();
              } else {
                const ruMatch = def.match(/如：「([^」]+)」/);
                if (ruMatch) {
                  ex = `我們在日常生活中常說「${ruMatch[1]}」。`;
                } else {
                  ex = `我們要認真體會並正確掌握「${wObj.word}」的用法。`;
                }
              }
              const cleanDef = def.replace(/\[例\].*$/, '').replace(/如：「.*$/, '').trim();
              textbookPool.push({
                id: `tb-${lesson.academicYear}-${wObj.word}`,
                type: 'vocabulary',
                category_name: `${press} 第${lesson.lessonNum}課`,
                word: wObj.word,
                title: wObj.word,
                zhuyin: '',
                definition: cleanDef || '課文生字語詞。',
                example: ex,
                synonyms: '',
                antonyms: '',
                template: wObj.word,
                pattern: wObj.word,
                difficulty: 'elementary',
                lessonNum: lesson.lessonNum,
                lessonTitle: lesson.lessonTitle,
                academicYear: lesson.academicYear,
                press: press
              });
            }
          });
        });
      }
    }

    // 依題型專題進行抽題
    if (isTextbookMode && textbookPool.length > 0) {
      const grade = textbookInfo ? textbookInfo.grade : '3';
      let gradeIdioms = bankByType.idiomMid;
      if (grade === '1' || grade === '2') gradeIdioms = bankByType.idiomLow;
      else if (grade === '5' || grade === '6') gradeIdioms = bankByType.idiomHigh;

      if (scope === 'zhuyin') {
        const candidates = shuffleArray(textbookPool.filter(i => i.zhuyin || rawBank.find(r => r.word === i.word && r.zhuyin)));
        for (let c of candidates) {
          if (!c.zhuyin) {
            const r = rawBank.find(item => item.word === c.word && item.zhuyin);
            if (r) c.zhuyin = r.zhuyin;
          }
          const q = buildZhuyinQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'typo') {
        const candidates = shuffleArray(textbookPool);
        for (let c of candidates) {
          const q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'unscramble') {
        const candidates = shuffleArray(textbookPool.filter(i => i.example && i.example.length >= 10));
        for (let c of candidates) {
          const q = buildUnscrambleQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'synonym') {
        const candidates = shuffleArray(textbookPool.filter(i => i.synonyms));
        for (let c of candidates) {
          const q = buildSynonymQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'situational' || scope === 'idiom') {
        const candidates = shuffleArray(gradeIdioms && gradeIdioms.length ? gradeIdioms : bankByType.idiom);
        for (let c of candidates) {
          const q = (scope === 'situational') ? buildSituationalQuestion(c) : buildClozeQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom_low') {
        const candidates = shuffleArray(bankByType.idiomLow && bankByType.idiomLow.length ? bankByType.idiomLow : bankByType.idiom);
        for (let c of candidates) {
          const q = buildClozeQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom_mid') {
        const candidates = shuffleArray(bankByType.idiomMid && bankByType.idiomMid.length ? bankByType.idiomMid : bankByType.idiom);
        for (let c of candidates) {
          const q = buildClozeQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom_high') {
        const candidates = shuffleArray(bankByType.idiomHigh && bankByType.idiomHigh.length ? bankByType.idiomHigh : bankByType.idiom);
        for (let c of candidates) {
          const q = buildClozeQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else {
        // 教科書綜合題型：按比例分配課文生字注音、錯字、克漏字與年級常用成語
        const tbShuffled = shuffleArray(textbookPool);
        const idiomShuffled = shuffleArray(gradeIdioms && gradeIdioms.length ? gradeIdioms : bankByType.idiom);
        let iIdx = 0;
        let tIdx = 0;

        while (collectedQuestions.length < targetCount && (tIdx < tbShuffled.length || iIdx < idiomShuffled.length)) {
          const r = collectedQuestions.length % 5;
          let q = null;
          if (r === 0 && tIdx < tbShuffled.length) {
            q = buildClozeQuestion(tbShuffled[tIdx++]);
          } else if (r === 1 && tIdx < tbShuffled.length) {
            const cand = tbShuffled[tIdx++];
            if (!cand.zhuyin) {
              const rb = rawBank.find(item => item.word === cand.word && item.zhuyin);
              if (rb) cand.zhuyin = rb.zhuyin;
            }
            q = buildZhuyinQuestion(cand) || buildClozeQuestion(cand);
          } else if (r === 2 && tIdx < tbShuffled.length) {
            q = buildTypoQuestion(tbShuffled[tIdx++]);
          } else if (r === 3 && iIdx < idiomShuffled.length) {
            const idiomItem = idiomShuffled[iIdx++];
            q = (Math.random() < 0.5) ? buildSituationalQuestion(idiomItem) : buildClozeQuestion(idiomItem);
          } else if (r === 4 && tIdx < tbShuffled.length) {
            q = buildUnscrambleQuestion(tbShuffled[tIdx++]) || buildClozeQuestion(tbShuffled[tIdx++]);
          }

          if (q) collectedQuestions.push(q);
        }
      }
    } else {
      // 原有非教科書全量題庫模式
      if (scope === 'zhuyin') {
        const candidates = shuffleArray(bankByType.withZhuyin);
        for (let c of candidates) {
          const q = buildZhuyinQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'synonym') {
        const candidates = shuffleArray(bankByType.withSynonyms);
        for (let c of candidates) {
          const q = buildSynonymQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'situational') {
        const candidates = shuffleArray(bankByType.idiom);
        for (let c of candidates) {
          const q = buildSituationalQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'conjunction') {
        const candidates = shuffleArray(bankByType.ellipsis);
        for (let c of candidates) {
          const q = buildConjunctionQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'typo') {
        const candidates = shuffleArray([...bankByType.idiom, ...bankByType.vocabulary]);
        for (let c of candidates) {
          const q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'unscramble') {
        const candidates = shuffleArray([...bankByType.idiom, ...bankByType.vocabulary]);
        for (let c of candidates) {
          const q = buildUnscrambleQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'sentence') {
        const candidates = shuffleArray(bankByType.sentence);
        for (let c of candidates) {
          const q = buildSentenceMimicQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'ellipsis') {
        const candidates = shuffleArray(bankByType.ellipsis);
        for (let c of candidates) {
          const q = buildConjunctionQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom') {
        const candidates = shuffleArray(bankByType.idiom);
        for (let c of candidates) {
          const r = Math.random();
          let q = null;
          if (r < 0.4) q = buildClozeQuestion(c);
          else if (r < 0.7) q = buildSituationalQuestion(c);
          else q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom_low') {
        const candidates = shuffleArray(bankByType.idiomLow && bankByType.idiomLow.length ? bankByType.idiomLow : bankByType.idiom);
        for (let c of candidates) {
          const r = Math.random();
          let q = null;
          if (r < 0.4) q = buildClozeQuestion(c);
          else if (r < 0.7) q = buildSituationalQuestion(c);
          else q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom_mid') {
        const candidates = shuffleArray(bankByType.idiomMid && bankByType.idiomMid.length ? bankByType.idiomMid : bankByType.idiom);
        for (let c of candidates) {
          const r = Math.random();
          let q = null;
          if (r < 0.4) q = buildClozeQuestion(c);
          else if (r < 0.7) q = buildSituationalQuestion(c);
          else q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'idiom_high') {
        const candidates = shuffleArray(bankByType.idiomHigh && bankByType.idiomHigh.length ? bankByType.idiomHigh : bankByType.idiom);
        for (let c of candidates) {
          const r = Math.random();
          let q = null;
          if (r < 0.4) q = buildClozeQuestion(c);
          else if (r < 0.7) q = buildSituationalQuestion(c);
          else q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'elementary') {
        const candidates = shuffleArray([...bankByType.vocabulary, ...bankByType.sentence]);
        for (let c of candidates) {
          let q = null;
          if (c.type === 'sentence') q = buildSentenceMimicQuestion(c);
          else if (Math.random() < 0.5) q = buildZhuyinQuestion(c);
          else q = buildClozeQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else if (scope === 'junior_high') {
        const candidates = shuffleArray([...bankByType.idiom, ...bankByType.ellipsis]);
        for (let c of candidates) {
          let q = null;
          if (c.type === 'ellipsis') q = buildConjunctionQuestion(c);
          else if (Math.random() < 0.5) q = buildSituationalQuestion(c);
          else q = buildTypoQuestion(c);
          if (q) collectedQuestions.push(q);
          if (collectedQuestions.length >= targetCount) break;
        }
      } else {
        // 綜合全題型：按比例分配 8 大題型
        const builders = [
          buildClozeQuestion,
          buildZhuyinQuestion,
          buildSynonymQuestion,
          buildSituationalQuestion,
          buildConjunctionQuestion,
          buildTypoQuestion,
          buildUnscrambleQuestion,
          buildSentenceMimicQuestion
        ];

        const poolShuffled = shuffleArray(rawBank);
        let bIdx = 0;
        for (let item of poolShuffled) {
          const builder = builders[bIdx % builders.length];
          const q = builder(item);
          if (q) {
            collectedQuestions.push(q);
            bIdx++;
          }
          if (collectedQuestions.length >= targetCount) break;
        }
      }
    }

    // 🌟 嚴格保證迴圈：若因特殊篩選使題目數不足 targetCount，立刻無縫自動補滿！
    let fallbackIdx = 0;
    const fallbackShuffled = (isTextbookMode && textbookPool.length > 0)
      ? shuffleArray(textbookPool)
      : shuffleArray(rawBank);

    while (collectedQuestions.length < targetCount) {
      const item = fallbackShuffled[fallbackIdx % fallbackShuffled.length] || rawBank[fallbackIdx % rawBank.length];
      fallbackIdx++;
      const q = buildClozeQuestion(item);
      if (q) collectedQuestions.push(q);
    }

    const finalQuestions = collectedQuestions.slice(0, targetCount);

    renderPaperQuestions(finalQuestions, showZhuyin);
    renderAnswerKey(finalQuestions);
  }

  // 輔助函式：依選項長度與題型智慧計算選項欄數，徹底避免注音或長文字重疊碰撞
  function renderOptionsHtml(options, letters, subType) {
    if (!options || !options.length) return '';
    const maxLen = Math.max(...options.map(o => (o || '').toString().length));
    let colsClass = 'cols-4';
    // 若為看字辨注音（注音字元多且包含聲調與空格）或選項長度大於 5 個字，自動採用 2 欄寬排
    if (subType === 'write_zhuyin' || maxLen > 5) {
      colsClass = 'cols-2';
    }
    // 若選項特別長（長句或長複句，大於 22 字），採用單欄排列
    if (maxLen > 22) {
      colsClass = 'cols-1';
    }

    return `
      <div class="q-options-row ${colsClass}">
        ${options.map((opt, oIdx) => `<div class="q-option-choice"><b>(${letters[oIdx]})</b> <span>${opt}</span></div>`).join('')}
      </div>
    `;
  }

  function renderPaperQuestions(questions, showZhuyin) {
    lastGeneratedPaperQuestions = questions || [];
    elements.printableQuestionsList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const qDiv = document.createElement('div');
      qDiv.className = 'question-item';

      const zhuyinHtml = (showZhuyin && q.zhuyin) ? `<span class="q-zhuyin-tag">(${formatZhuyin(q.zhuyin)})</span>` : '';

      if (q.quizType === 'zhuyin') {
        // 國字注音辨別題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge" style="background:#e0f2fe; color:#0369a1;">國字注音</span>
            <span style="font-weight:700; color:#111;">${q.promptLabel || '【國字注音測驗】'}</span>
          </div>
          <div class="q-body">${q.promptSentence}</div>
          ${renderOptionsHtml(q.options, letters, q.subType)}
          <div style="font-size:0.86rem; color:#475569; margin-top:8px; padding-left:20px;">
            ✍️ ${q.handwriteHint}
          </div>
        `;
      } else if (q.quizType === 'synonym') {
        // 近義詞替換題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge" style="background:#f3e8ff; color:#6b21a8;">詞義辨析</span>
            <span style="font-weight:700; color:#111;">【文意相近詞語替換】</span>
          </div>
          <div class="q-body">${q.promptSentence}</div>
          ${renderOptionsHtml(q.options, letters, q.quizType)}
        `;
      } else if (q.quizType === 'situational') {
        // 成語生活情境素養題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge" style="background:#fef3c7; color:#92400e;">情境素養</span>
            <span style="font-weight:700; color:#111;">${q.subCategory || '【生活語境成語應用】'}</span>
          </div>
          <div class="q-body" style="background:#fdfdfd; padding:8px 12px; border-left:3px solid #f59e0b; border-radius:4px; margin:4px 0 8px 0;">
            ${q.promptSentence}
          </div>
          ${renderOptionsHtml(q.options, letters, q.quizType)}
        `;
      } else if (q.quizType === 'conjunction') {
        // 關聯詞複句邏輯選擇題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge" style="background:#ecfdf5; color:#065f46;">關聯複句</span>
            <span style="font-weight:700; color:#111;">【複句邏輯連詞選擇】</span>
          </div>
          <div class="q-body">${q.promptSentence}</div>
          ${renderOptionsHtml(q.options, letters, q.quizType)}
        `;
      } else if (q.quizType === 'typo') {
        // 錯字訂正題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        const sentenceWithMark = q.typoSentence.replace(q.typoWord, `【<u>${q.typoWord}</u>】`);

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge" style="background:#fee2e2; color:#991b1b;">錯字訂正</span>
            <span style="font-weight:700; color:#111;">【挑出錯別字並訂正】</span>
            ${zhuyinHtml}
          </div>
          <div class="q-body">下列文句中畫底線處含有一個錯別字，請選出改正後的正確字：<br>「${sentenceWithMark}」</div>
          ${renderOptionsHtml(q.options, letters, q.quizType)}
        `;
      } else if (q.quizType === 'unscramble') {
        // 重組造句題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge" style="background:#fef3c7; color:#92400e;">重組造句</span>
            <span style="font-weight:700; color:#111;">【文句語意重組排序】</span>
          </div>
          <div class="q-body">
            請將下列打亂順序的詞語區塊，重組成文意流暢合理的完整句子：
            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px; margin:6px 0; font-weight:600;">
              ${q.labeledCards.map(c => `<span><b>${c.label}、</b>${c.text}</span>`).join('　')}
            </div>
          </div>
          ${renderOptionsHtml(q.options, letters, q.quizType)}
          <div style="font-size:0.86rem; color:#475569; margin-top:8px; padding-left:20px;">
            ✍️ 重組排序：( 　 ) ➔ ( 　 ) ➔ ( 　 ) ➔ ( 　 )
          </div>
        `;
      } else if (q.quizType === 'sentence') {
        // 照樣造句題 (純例句自由仿寫，可勾選顯示骨架結構)
        q._correctLetter = '照樣仿寫題（參見標準範例）';
        
        const exampleText = (q.template || q.example || q.title || q.word || '').replace(/[()（）]/g, '').replace(/。$/, '');
        let templateText = q.template || q.title || '';
        if (!templateText.includes('　') && templateText.includes('(')) {
          templateText = templateText.replace(/\(([^)]+)\)/g, '(　　)');
        }

        const showPattern = elements.chkShowMimicPattern && elements.chkShowMimicPattern.checked;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-number">${qNum}.</span>
            <span class="q-badge">${q.category_name || '短語練習'}</span>
            <span style="font-weight: 700; color: #1e293b;">【照樣寫短語】</span>
          </div>
          <div class="q-body">請仔細體會【例句示範】的詞性節奏與句構特徵，發揮創意照樣仿寫出一個通順生動的短語：</div>
          <div class="q-handwrite-box">
            <div class="q-example-prompt">
              <span class="ex-tag">📖【例句示範】</span><strong>${exampleText}</strong>
            </div>
            ${showPattern ? `
            <div class="q-pattern-template">
              <span class="pat-tag">【仿寫結構】</span><strong>${templateText}</strong>
            </div>` : ''}
            <div class="q-student-write-guide">✏️ 請照樣仿寫作答：</div>
            <div class="handwrite-line"></div>
          </div>
        `;
      } else {
        // 標準克漏字題
        const correctLetter = letters[q.options.indexOf(q.correctAnswer)];
        q._correctLetter = correctLetter;

        qDiv.innerHTML = `
          <div class="q-header">
            <span class="q-bracket">(　　)</span>
            <span class="q-number">${qNum}.</span>
            <span class="q-badge">${q.category_name}</span>
            ${zhuyinHtml}
          </div>
          <div class="q-body">${q.promptSentence}</div>
          ${renderOptionsHtml(q.options, letters, q.quizType)}
        `;
      }

      elements.printableQuestionsList.appendChild(qDiv);
    });
  }

  function renderAnswerKey(questions) {
    elements.printableAnswerKeyList.innerHTML = '';

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const ansDiv = document.createElement('div');
      ansDiv.className = 'answer-item';

      if (q.quizType === 'zhuyin') {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge" style="background:#e0f2fe; color:#0369a1;">第 ${qNum} 題 國字注音</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctAnswer}</span>
            <span class="ans-word">${q.word} (${formatZhuyin(q.zhuyin)})</span>
          </div>
          <div class="ans-desc"><b>【字詞釋義】</b>${q.definition || '無'}</div>
          ${q.example ? `<div class="ans-full-ex"><b>【完整例句】</b>${q.example}</div>` : ''}
        `;
      } else if (q.quizType === 'synonym') {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge" style="background:#f3e8ff; color:#6b21a8;">第 ${qNum} 題 近義替換</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctAnswer}</span>
            <span class="ans-word">「${q.targetWord}」與「${q.synonymWord}」語意相近</span>
          </div>
          <div class="ans-desc"><b>【詞義釋義】</b>${q.definition || '無'} ｜ 相似詞：${q.synonyms || '無'}</div>
          ${q.example ? `<div class="ans-full-ex"><b>【文句語境】</b>${q.example}</div>` : ''}
        `;
      } else if (q.quizType === 'situational') {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge" style="background:#fef3c7; color:#92400e;">第 ${qNum} 題 情境素養</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctAnswer}</span>
            <span class="ans-word">【${q.word}】 (${formatZhuyin(q.zhuyin)})</span>
          </div>
          <div class="ans-desc"><b>【成語釋義】</b>${q.definition || '無'}</div>
          ${q.example ? `<div class="ans-full-ex"><b>【生活範例】</b>${q.example}</div>` : ''}
        `;
      } else if (q.quizType === 'conjunction') {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge" style="background:#ecfdf5; color:#065f46;">第 ${qNum} 題 關聯複句</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctAnswer}</span>
          </div>
          <div class="ans-full-ex"><b>【完整複句示範】</b>${q.example}</div>
        `;
      } else if (q.quizType === 'typo') {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge" style="background:#fee2e2; color:#991b1b;">第 ${qNum} 題 錯字訂正</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctAnswer}</span>
            <span class="ans-word">錯字「${q.typoChar}」➔ 正字「${q.targetChar}」</span>
          </div>
          <div class="ans-desc"><b>【詞條正字】</b><strong>${q.word}</strong> (${formatZhuyin(q.zhuyin)}) ｜ 釋義：${q.definition || '無'}</div>
          <div class="ans-full-ex"><b>【正確原句】</b>${q.example}</div>
        `;
      } else if (q.quizType === 'unscramble') {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge" style="background:#fef3c7; color:#92400e;">第 ${qNum} 題 重組造句</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctOrderLabels}</span>
          </div>
          <div class="ans-full-ex"><b>【重組完整句子】</b>${q.cleanSentence}。</div>
        `;
      } else if (q.quizType === 'sentence') {
        const exampleText = (q.template || q.example || q.title || q.word || '').replace(/[()（）]/g, '').replace(/。$/, '');
        const guidance = getSentenceMimicGuidance(q);

        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge">第 ${qNum} 題 照樣仿寫</span>
            <span class="ans-word">題目示範：${exampleText}</span>
          </div>
          <div class="ans-desc" style="margin-top:4px;">
            <b>【題目示範例句】</b><span style="color:#334155; font-weight:600;">${exampleText}</span>
          </div>
          <div class="ans-mimic-box" style="background:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #10b981; padding:8px 12px; border-radius:6px; margin:6px 0;">
            <div style="color:#065f46; font-weight:800; font-size:0.95rem; margin-bottom:4px;">
              💡【建議仿寫參考答案】（提供教師與家長批改核對）：
            </div>
            <div style="color:#047857; font-weight:700; line-height:1.6; padding-left:4px;">
              ${guidance.suggestions.map((s, sIdx) => `<div>👉 <b>建議答案 ${sIdx + 1}：</b>${s}</div>`).join('')}
            </div>
          </div>
          ${guidance.structure ? `<div class="ans-desc" style="margin-top:3px;"><b>【句構特徵解析】</b><span style="color:#4f46e5; font-weight:600;">${guidance.structure}</span></div>` : ''}
          <div style="font-size:0.82rem; color:#64748b; margin-top:4px; line-height:1.45;">
            ※ <b>批改給分指引</b>：本題為開放式句構仿寫，<b>不硬性限制必須使用相同字詞</b>。只要字數節奏相近、詞性結構對稱（動詞對動詞、形容詞對形容詞、名詞對名詞）且語意流暢生動，均應評為滿分。
          </div>
        `;
      } else {
        ansDiv.innerHTML = `
          <div class="ans-title-row">
            <span class="ans-badge">第 ${qNum} 題 克漏字</span>
            <span style="color:#000; font-weight:800; font-size:1.05rem;">正解：(${q._correctLetter}) ${q.correctAnswer}</span>
            <span class="ans-word">${q.word} (${formatZhuyin(q.zhuyin)})</span>
          </div>
          <div class="ans-desc"><b>【詞義釋義】</b>${q.definition || '無'}</div>
          ${q.example ? `<div class="ans-full-ex"><b>【完整例句】</b>${q.example}</div>` : ''}
        `;
      }

      elements.printableAnswerKeyList.appendChild(ansDiv);
    });
  }

  // ============================================================================
  // 核心功能 2: 線上互動測驗系統 (支援 8 大題型)
  // ============================================================================
  async function startNewQuizSession(mode) {
    quizScore = 0;
    quizStreak = 0;
    currentQuizIndex = 0;
    updateQuizStats();

    currentQuizList = [];
    const count = 10;

    // 🌟 優先使用雲端 Serverless API 出題
    if (window.location.protocol.startsWith('http')) {
      try {
        const apiUrl = `/api/quiz?mode=${encodeURIComponent(mode)}&count=${count}`;
        const resp = await fetch(apiUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
            currentQuizList = data.questions;
            renderCurrentQuizQuestion();
            return;
          }
        }
      } catch (err) {
        console.warn('雲端 API 測驗抽題失敗，降級本機題庫：', err);
      }
    }

    let candidates = [];
    if (mode === 'zhuyin') {
      candidates = shuffleArray(bankByType.withZhuyin);
      for (let c of candidates) {
        const q = buildZhuyinQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'synonym') {
      candidates = shuffleArray(bankByType.withSynonyms);
      for (let c of candidates) {
        const q = buildSynonymQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'situational') {
      candidates = shuffleArray(bankByType.idiom);
      for (let c of candidates) {
        const q = buildSituationalQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'conjunction') {
      candidates = shuffleArray(bankByType.ellipsis);
      for (let c of candidates) {
        const q = buildConjunctionQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'typo') {
      candidates = shuffleArray([...bankByType.idiom, ...bankByType.vocabulary]);
      for (let c of candidates) {
        const q = buildTypoQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'unscramble') {
      candidates = shuffleArray([...bankByType.idiom, ...bankByType.vocabulary]);
      for (let c of candidates) {
        const q = buildUnscrambleQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'sentence') {
      candidates = shuffleArray(bankByType.sentence);
      for (let c of candidates) {
        const q = buildSentenceMimicQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'idiom_low') {
      candidates = shuffleArray(bankByType.idiomLow && bankByType.idiomLow.length ? bankByType.idiomLow : bankByType.idiom);
      for (let c of candidates) {
        const r = Math.random();
        let q = null;
        if (r < 0.4) q = buildClozeQuestion(c);
        else if (r < 0.7) q = buildSituationalQuestion(c);
        else q = buildTypoQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'idiom_mid') {
      candidates = shuffleArray(bankByType.idiomMid && bankByType.idiomMid.length ? bankByType.idiomMid : bankByType.idiom);
      for (let c of candidates) {
        const r = Math.random();
        let q = null;
        if (r < 0.4) q = buildClozeQuestion(c);
        else if (r < 0.7) q = buildSituationalQuestion(c);
        else q = buildTypoQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'idiom_high') {
      candidates = shuffleArray(bankByType.idiomHigh && bankByType.idiomHigh.length ? bankByType.idiomHigh : bankByType.idiom);
      for (let c of candidates) {
        const r = Math.random();
        let q = null;
        if (r < 0.4) q = buildClozeQuestion(c);
        else if (r < 0.7) q = buildSituationalQuestion(c);
        else q = buildTypoQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else if (mode === 'elementary') {
      candidates = shuffleArray(bankByType.vocabulary);
      for (let c of candidates) {
        const q = buildClozeQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    } else {
      // 隨機混合
      const pool = shuffleArray(rawBank);
      for (let c of pool) {
        const r = Math.random();
        let q = null;
        if (r < 0.2) q = buildClozeQuestion(c);
        else if (r < 0.35) q = buildZhuyinQuestion(c);
        else if (r < 0.5) q = buildSynonymQuestion(c);
        else if (r < 0.65) q = buildSituationalQuestion(c);
        else if (r < 0.8) q = buildTypoQuestion(c);
        else q = buildUnscrambleQuestion(c);
        if (q) currentQuizList.push(q);
        if (currentQuizList.length >= count) break;
      }
    }

    // 補齊
    let fIdx = 0;
    while (currentQuizList.length < count) {
      const q = buildClozeQuestion(rawBank[fIdx % rawBank.length]);
      if (q) currentQuizList.push(q);
      fIdx++;
    }

    renderCurrentQuizQuestion();
  }

  function updateQuizStats() {
    elements.quizScore.textContent = quizScore;
    elements.quizStreak.textContent = quizStreak;
    elements.quizProgress.textContent = `${currentQuizIndex + 1} / ${currentQuizList.length || 10}`;
  }

  function renderCurrentQuizQuestion() {
    if (currentQuizIndex >= currentQuizList.length) {
      renderQuizFinishedCard();
      return;
    }

    updateQuizStats();
    elements.quizExplanationBox.style.display = 'none';

    const q = currentQuizList[currentQuizIndex];

    if (q.quizType === 'unscramble') {
      elements.quizCategoryBadge.textContent = '重組造句';
      elements.quizCategoryBadge.className = 'badge badge-primary';
      elements.quizTypeHint.textContent = '請依序點選下方詞塊，組裝成流暢完整的句子';
      elements.quizOptionsContainer.style.display = 'none';
      elements.quizUnscrambleContainer.style.display = 'block';
      elements.quizWriteContainer.style.display = 'none';

      elements.quizQuestionPrompt.innerHTML = `文句重組：請將打亂的 4 個詞語依序點擊排好`;
      elements.quizPromptHint.innerHTML = `💡 提示：按語法順序點擊詞塊卡片，點錯可按「重排」重置。`;

      unscrambleUserSlots = [];
      renderUnscrambleInteractive(q);
    } else if (q.quizType === 'sentence') {
      elements.quizCategoryBadge.textContent = '短語仿寫';
      elements.quizCategoryBadge.className = 'badge badge-primary';
      elements.quizTypeHint.textContent = '觀察示範例句之詞性與節奏進行仿寫';
      elements.quizOptionsContainer.style.display = 'none';
      elements.quizUnscrambleContainer.style.display = 'none';
      elements.quizWriteContainer.style.display = 'block';
      elements.txtUserWriting.value = '';

      const exampleText = (q.template || q.example || q.title || q.word || '').replace(/[()（）]/g, '').replace(/。$/, '');

      elements.quizQuestionPrompt.innerHTML = `
        <div style="font-size:1.05rem; font-weight:700; color:#1e293b; margin-bottom:12px;">請體會示範短語的詞性節奏，發揮創意照樣仿寫：</div>
        <div class="q-example-prompt" style="margin-bottom:8px;">
          <span class="ex-tag">📖【例句示範】</span><strong>${exampleText}</strong>
        </div>
      `;
      elements.quizPromptHint.innerHTML = `💡 提示：掌握句構節奏與詞性搭配即可，用詞不需完全一模一樣（例如「一面…一面…」亦可仿寫為「一邊…一邊…」）。`;
    } else {
      // 選擇題型 (克漏字、注音、近義、情境、錯字、關聯詞)
      elements.quizOptionsContainer.style.display = 'grid';
      elements.quizUnscrambleContainer.style.display = 'none';
      elements.quizWriteContainer.style.display = 'none';

      let catName = '測驗挑戰';
      if (q.quizType === 'zhuyin') catName = '國字注音';
      else if (q.quizType === 'synonym') catName = '近義替換';
      else if (q.quizType === 'situational') catName = '情境素養';
      else if (q.quizType === 'conjunction') catName = '關聯複句';
      else if (q.quizType === 'typo') catName = '錯字訂正';
      else catName = q.category_name || '詞語造句';

      elements.quizCategoryBadge.textContent = catName;
      elements.quizCategoryBadge.className = 'badge badge-primary';
      elements.quizTypeHint.textContent = '請從下列選項中選出最適當的答案';

      elements.quizQuestionPrompt.innerHTML = q.promptSentence || q.example;
      if (q.quizType === 'typo') {
        elements.quizPromptHint.style.display = 'block';
        elements.quizPromptHint.innerHTML = `💡 請仔細觀察句中畫底線處的詞語，選出改正後的正確字。`;
      } else {
        elements.quizPromptHint.innerHTML = '';
        elements.quizPromptHint.style.display = 'none';
      }

      elements.quizOptionsContainer.innerHTML = '';
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `<span>${opt}</span> <span class="opt-mark"></span>`;
        btn.addEventListener('click', () => handleChoiceAnswer(btn, opt, q));
        elements.quizOptionsContainer.appendChild(btn);
      });
    }
  }

  function handleChoiceAnswer(btn, selectedValue, question) {
    const allBtns = elements.quizOptionsContainer.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    const isCorrect = (selectedValue === question.correctAnswer);

    if (isCorrect) {
      btn.classList.add('correct');
      btn.querySelector('.opt-mark').textContent = '✅';
      quizScore += 10;
      quizStreak += 1;
      elements.quizResultStatus.textContent = '🎉 答對了！太厲害了！';
      elements.quizResultStatus.className = 'result-status success';
    } else {
      btn.classList.add('wrong');
      btn.querySelector('.opt-mark').textContent = '❌';
      quizStreak = 0;
      elements.quizResultStatus.textContent = '💡 差一點點，再接再厲！';
      elements.quizResultStatus.className = 'result-status error';

      allBtns.forEach(b => {
        if (b.textContent.includes(question.correctAnswer)) {
          b.classList.add('correct');
          b.querySelector('.opt-mark').textContent = '✅';
        }
      });
    }

    updateQuizStats();

    elements.quizCorrectAnswer.innerHTML = `正確解答：<strong>${question.correctAnswer}</strong>`;
    elements.quizFullExample.innerHTML = `<strong>參考例句：</strong>${question.example || question.cleanSentence || '無完整原句'}`;

    let props = [];
    if (question.word) props.push(`詞條：${question.word}`);
    if (question.zhuyin) props.push(`注音：${question.zhuyin}`);
    if (question.definition) props.push(`釋義：${question.definition}`);
    elements.quizDetailProps.textContent = props.join(' ｜ ');

    elements.quizExplanationBox.style.display = 'block';
  }

  function renderUnscrambleInteractive(q) {
    elements.traySlots.innerHTML = '<span class="empty-hint">請依序點擊下方卡片...</span>';
    elements.unscrambleCardsGrid.innerHTML = '';

    q.labeledCards.forEach(c => {
      const cardBtn = document.createElement('button');
      cardBtn.className = 'unscramble-card-btn';
      cardBtn.innerHTML = `<strong>${c.label}</strong> <span>${c.text}</span>`;
      cardBtn.addEventListener('click', () => {
        if (cardBtn.classList.contains('selected')) return;
        cardBtn.classList.add('selected');
        unscrambleUserSlots.push(c);
        updateUnscrambleTray();
      });
      elements.unscrambleCardsGrid.appendChild(cardBtn);
    });
  }

  function updateUnscrambleTray() {
    if (unscrambleUserSlots.length === 0) {
      elements.traySlots.innerHTML = '<span class="empty-hint">請依序點擊下方卡片...</span>';
      return;
    }
    elements.traySlots.innerHTML = '';
    unscrambleUserSlots.forEach((c, idx) => {
      const chip = document.createElement('span');
      chip.className = 'unscramble-chip';
      chip.innerHTML = `<b>${idx + 1}.</b> ${c.label} (${c.text})`;
      elements.traySlots.appendChild(chip);
    });
  }

  function resetUnscrambleTray() {
    unscrambleUserSlots = [];
    updateUnscrambleTray();
    const cards = elements.unscrambleCardsGrid.querySelectorAll('.unscramble-card-btn');
    cards.forEach(c => c.classList.remove('selected'));
  }

  function submitUnscrambleAnswer() {
    const q = currentQuizList[currentQuizIndex];
    if (!q || !q.correctOrderLabels) return;

    if (unscrambleUserSlots.length < 4) {
      alert('請先點選滿 4 個詞組卡片再提交！');
      return;
    }

    const userOrder = unscrambleUserSlots.map(c => c.label).join('');
    const isCorrect = (userOrder === q.correctOrderLabels);

    if (isCorrect) {
      quizScore += 10;
      quizStreak += 1;
      elements.quizResultStatus.textContent = '🎉 語意重組完全正確！太棒了！';
      elements.quizResultStatus.className = 'result-status success';
    } else {
      quizStreak = 0;
      elements.quizResultStatus.textContent = '💡 排序稍有不同，來看看正確順序吧！';
      elements.quizResultStatus.className = 'result-status error';
    }

    updateQuizStats();

    elements.quizCorrectAnswer.innerHTML = `正確排列順序：<strong>${q.correctOrderLabels}</strong>`;
    elements.quizFullExample.innerHTML = `<strong>重組完整句子：</strong>${q.cleanSentence}。`;
    elements.quizDetailProps.textContent = `原詞詞條：${q.word || q.title}`;
    elements.quizExplanationBox.style.display = 'block';
  }

  function showWriteSample() {
    const q = currentQuizList[currentQuizIndex];
    elements.quizResultStatus.textContent = '✨ 參考示範範例';
    elements.quizResultStatus.className = 'result-status success';
    if (q.quizType === 'sentence') {
      const guidance = getSentenceMimicGuidance(q);
      elements.quizCorrectAnswer.innerHTML = `建議仿寫答案：<strong>${guidance.suggestions[0]}</strong>${guidance.suggestions[1] ? ` 或 <strong>${guidance.suggestions[1]}</strong>` : ''}`;
      const cleanPrompt = (q.template || q.example || q.title || q.word || '').replace(/[()（）]/g, '');
      elements.quizFullExample.innerHTML = `<strong>題目原示範：</strong>${cleanPrompt}<br><strong>句構特徵解析：</strong>${guidance.structure}<br><span style="color:#64748b; font-size:0.85rem;">評分原則：本題為開放式仿寫，只要詞性搭配與節奏對齊、語意通順即可滿分。</span>`;
    } else {
      elements.quizCorrectAnswer.innerHTML = `標準參考：<strong>${q.example}</strong>`;
      elements.quizFullExample.innerHTML = `<strong>結構解析：</strong>${q.definition || '詞性結構對齊，語意通順完整。'}`;
    }
    elements.quizDetailProps.textContent = '';
    elements.quizExplanationBox.style.display = 'block';

    quizScore += 10;
    quizStreak += 1;
    updateQuizStats();
  }

  function nextQuestion() {
    currentQuizIndex++;
    renderCurrentQuizQuestion();
  }

  function renderQuizFinishedCard() {
    elements.quizQuestionPrompt.innerHTML = '🎊 本輪測驗完成！';
    elements.quizPromptHint.innerHTML = `
      您的最終得分：<strong style="color:var(--primary); font-size:1.4rem;">${quizScore}</strong> 分！<br>
      最高連勝紀錄：<strong>${quizStreak}</strong> 次！
    `;
    elements.quizOptionsContainer.style.display = 'none';
    elements.quizUnscrambleContainer.style.display = 'none';
    elements.quizWriteContainer.style.display = 'none';
    elements.quizExplanationBox.style.display = 'none';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary btn-block';
    retryBtn.textContent = '🔄 再挑戰一輪 (換新題庫)';
    retryBtn.addEventListener('click', () => startNewQuizSession(quizCurrentMode));
    elements.quizOptionsContainer.innerHTML = '';
    elements.quizOptionsContainer.style.display = 'block';
    elements.quizOptionsContainer.appendChild(retryBtn);
  }

  // ============================================================================
  // 核心功能 3: 題庫字典大檢索 (全量 31,302 筆)
  // ============================================================================
  function initDictSearch() {
    filterDictionary();
  }

  let dictIsServerMode = false;

  async function filterDictionary() {
    const keyword = elements.dictSearchInput.value.trim().toLowerCase();
    const type = elements.dictFilterType.value;
    dictCurrentPage = 1;

    // 🌟 優先使用雲端 Serverless /api/search 分頁高速檢索
    if (window.location.protocol.startsWith('http')) {
      try {
        const searchUrl = `/api/search?q=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}&page=1&limit=${DICT_PAGE_SIZE}`;
        const resp = await fetch(searchUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            dictIsServerMode = true;
            elements.dictResultCount.textContent = (data.total || 0).toLocaleString();
            elements.dictCardsList.innerHTML = '';
            renderDictCardsList(data.items || []);
            if ((data.items || []).length < data.total) {
              elements.btnLoadMoreDict.style.display = 'inline-block';
            } else {
              elements.btnLoadMoreDict.style.display = 'none';
            }
            return;
          }
        }
      } catch (err) {
        console.warn('雲端字典搜尋失敗，降級本機搜尋：', err);
      }
    }

    dictIsServerMode = false;
    dictFilteredList = rawBank.filter(item => {
      if (type !== 'all' && item.type !== type) return false;
      if (!keyword) return true;

      const matchWord = (item.word || '').toLowerCase().includes(keyword);
      const matchZhuyin = (item.zhuyin || '').toLowerCase().includes(keyword);
      const matchDef = (item.definition || '').toLowerCase().includes(keyword);
      const matchEx = (item.example || '').toLowerCase().includes(keyword);
      return matchWord || matchZhuyin || matchDef || matchEx;
    });

    elements.dictResultCount.textContent = dictFilteredList.length.toLocaleString();
    renderDictCards();
  }

  function renderDictCards() {
    elements.dictCardsList.innerHTML = '';
    appendDictCardsBatch();
  }

  function renderDictCardsList(items) {
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'dict-card';

      const typeBadgeClass = (item.type === 'idiom') ? 'badge-primary' : 'badge-success';

      card.innerHTML = `
        <div class="dict-card-header">
          <span class="dict-word-title">${item.word || item.title}</span>
          <span class="badge ${typeBadgeClass}">${item.category_name || (item.type === 'idiom' ? '成語熟語' : '常用字詞')}</span>
        </div>
        ${item.zhuyin ? `<div class="dict-zhuyin">注音：${item.zhuyin}</div>` : ''}
        ${item.definition ? `<div class="dict-def"><b>釋義：</b>${item.definition}</div>` : ''}
        ${item.example ? `<div class="dict-ex"><b>例句：</b>${item.example}</div>` : ''}
      `;
      elements.dictCardsList.appendChild(card);
    });
  }

  function appendDictCardsBatch() {
    const start = (dictCurrentPage - 1) * DICT_PAGE_SIZE;
    const end = start + DICT_PAGE_SIZE;
    const batch = dictFilteredList.slice(start, end);
    renderDictCardsList(batch);

    if (end < dictFilteredList.length) {
      elements.btnLoadMoreDict.style.display = 'inline-block';
    } else {
      elements.btnLoadMoreDict.style.display = 'none';
    }
  }

  async function loadMoreDictItems() {
    dictCurrentPage++;
    if (dictIsServerMode) {
      const keyword = elements.dictSearchInput.value.trim().toLowerCase();
      const type = elements.dictFilterType.value;
      try {
        const searchUrl = `/api/search?q=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}&page=${dictCurrentPage}&limit=${DICT_PAGE_SIZE}`;
        const resp = await fetch(searchUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && Array.isArray(data.items)) {
            renderDictCardsList(data.items);
            const loaded = dictCurrentPage * DICT_PAGE_SIZE;
            if (loaded < data.total) {
              elements.btnLoadMoreDict.style.display = 'inline-block';
            } else {
              elements.btnLoadMoreDict.style.display = 'none';
            }
            return;
          }
        }
      } catch (e) {
        console.warn('雲端載入更多失敗：', e);
      }
    }
    appendDictCardsBatch();
  }

  // ============================================================================
  // 核心功能 4: 會員帳號系統 (學生、教師、家長多角色登入與切換)
  // ============================================================================
  let lastGeneratedPaperQuestions = [];
  let currentUser = {
    id: 'u-student-1',
    username: 'student',
    real_name: '李小明',
    role: 'student',
    school_name: '示範國小',
    grade_class: '三年二班'
  };
  let currentRunningExam = null;
  let examTimerInterval = null;
  let examStartTime = 0;
  let currentRetestItem = null;
  let collabFilterStatus = 'all';
  let mistakeFilterStatus = 'all';
  let cachedCollabList = [];
  let cachedMistakesList = [];

  function showToast(message, type = 'info') {
    let container = document.getElementById('appToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'appToastContainer';
      container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#4f46e5');
    toast.style.cssText = `background:${bg}; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; font-size:0.92rem; box-shadow:0 8px 24px rgba(0,0,0,0.18); display:flex; align-items:center; gap:8px; pointer-events:auto; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); opacity:0; transform:translateY(16px);`;
    toast.innerHTML = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  function getRoleTitle(role) {
    if (role === 'teacher') return '教師';
    if (role === 'parent') return '家長';
    return '學生';
  }

  function getRoleAvatar(role) {
    if (role === 'teacher') return '👨‍🏫';
    if (role === 'parent') return '👨‍👩‍👦';
    return '👦';
  }

  function initUserAuth() {
    const saved = localStorage.getItem('muchlearning_user');
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
      } catch (e) {
        console.warn('使用者狀態解析失敗：', e);
      }
    }
    updateUserHeaderUI();

    if (elements.btnUserAuth) {
      elements.btnUserAuth.addEventListener('click', () => {
        if (currentUser) {
          const roleTitle = getRoleTitle(currentUser.role);
          if (confirm(`目前登入帳號：【${currentUser.real_name} (${roleTitle})】\n所屬：${currentUser.school_name || '示範學校'} ${currentUser.grade_class || ''}\n\n是否切換其他展示帳號或重新登入？`)) {
            openAuthModal();
          }
        } else {
          openAuthModal();
        }
      });
    }

    if (elements.btnCloseAuthModal) {
      elements.btnCloseAuthModal.addEventListener('click', closeAuthModal);
    }
    if (elements.modalAuth) {
      elements.modalAuth.addEventListener('click', (e) => {
        if (e.target === elements.modalAuth) closeAuthModal();
      });
    }

    if (elements.tabAuthLogin && elements.tabAuthRegister) {
      elements.tabAuthLogin.addEventListener('click', () => {
        elements.tabAuthLogin.classList.add('active');
        elements.tabAuthRegister.classList.remove('active');
        elements.formLogin.style.display = 'block';
        elements.formRegister.style.display = 'none';
      });
      elements.tabAuthRegister.addEventListener('click', () => {
        elements.tabAuthRegister.classList.add('active');
        elements.tabAuthLogin.classList.remove('active');
        elements.formLogin.style.display = 'none';
        elements.formRegister.style.display = 'block';
      });
    }

    // 1-Click 快速展示帳號切換
    if (elements.btnQuickTeacher) {
      elements.btnQuickTeacher.addEventListener('click', () => performQuickLogin('teacher', '王大成 老師', 'teacher', '示範國小', '三年二班導師'));
    }
    if (elements.btnQuickStudent) {
      elements.btnQuickStudent.addEventListener('click', () => performQuickLogin('student', '李小明', 'student', '示範國小', '三年二班 07號'));
    }
    if (elements.btnQuickParent) {
      elements.btnQuickParent.addEventListener('click', () => performQuickLogin('parent', '李爸爸', 'parent', '示範國小', '家長委員會'));
    }

    // 登入表單提交
    if (elements.formLogin) {
      elements.formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = (elements.loginUsername.value || '').trim();
        const password = (elements.loginPassword.value || '').trim();

        if (window.location.protocol.startsWith('http')) {
          try {
            const resp = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'login', username, password })
            });
            const data = await resp.json();
            if (data.success && data.user) {
              applyLoggedInUser(data.user);
              return;
            } else {
              alert(data.error || '帳號或密碼錯誤');
              return;
            }
          } catch (err) {
            console.warn('雲端驗證失敗，切換本機快速相容：', err);
          }
        }

        // 本機離線演示兜底
        if (username === 'teacher') {
          performQuickLogin('teacher', '王大成 老師', 'teacher', '示範國小', '導師');
        } else if (username === 'parent') {
          performQuickLogin('parent', '李爸爸', 'parent', '示範國小', '家長');
        } else {
          performQuickLogin('student', '李小明', 'student', '示範國小', '三年二班');
        }
      });
    }

    // 註冊表單提交
    if (elements.formRegister) {
      elements.formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = elements.regRole.value;
        const username = elements.regUsername.value.trim();
        const password = elements.regPassword.value.trim();
        const real_name = elements.regRealName.value.trim();
        const school_name = elements.regSchool.value.trim() || '示範國小';

        const payload = { action: 'register', role, username, password, real_name, school_name };

        if (window.location.protocol.startsWith('http')) {
          try {
            const resp = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (data.success && data.user) {
              applyLoggedInUser(data.user);
              return;
            } else {
              alert(data.error || '註冊失敗');
              return;
            }
          } catch (err) {
            console.warn('雲端註冊失敗：', err);
          }
        }

        const newUser = { id: `u-${Date.now()}`, username, role, real_name, school_name, grade_class: '三年級' };
        applyLoggedInUser(newUser);
      });
    }
  }

  function openAuthModal() {
    if (elements.modalAuth) elements.modalAuth.classList.add('active');
  }

  function closeAuthModal() {
    if (elements.modalAuth) elements.modalAuth.classList.remove('active');
  }

  function performQuickLogin(username, real_name, role, school_name, grade_class) {
    const user = {
      id: `u-${role}-1`,
      username,
      real_name,
      role,
      school_name,
      grade_class
    };
    applyLoggedInUser(user);
  }

  function applyLoggedInUser(user) {
    currentUser = user;
    localStorage.setItem('muchlearning_user', JSON.stringify(user));
    updateUserHeaderUI();
    closeAuthModal();
    showToast(`🎉 歡迎回來，${currentUser.real_name} (${getRoleTitle(currentUser.role)})！`, 'success');

    // 重新整理各分頁資訊
    loadUserHistory();
    loadCollabQuestions();
  }

  function updateUserHeaderUI() {
    if (!elements.userStatusText) return;
    if (currentUser) {
      elements.userAvatarIcon.textContent = getRoleAvatar(currentUser.role);
      elements.userStatusText.textContent = `${currentUser.real_name} (${getRoleTitle(currentUser.role)})`;
      if (elements.inputStudentName) {
        elements.inputStudentName.value = currentUser.real_name;
      }
    } else {
      elements.userAvatarIcon.textContent = '👤';
      elements.userStatusText.textContent = '登入 / 註冊';
    }
  }

  // ============================================================================
  // 核心功能 5: 班級試卷單一識別碼 (Exam Code)、同題作答與全班英雄榜
  // ============================================================================
  function initExamModule() {
    // 1. 發布試卷碼按鈕
    if (elements.btnPublishExamCode) {
      elements.btnPublishExamCode.addEventListener('click', publishWorksheetAsExam);
    }

    // 關閉發布彈窗
    if (elements.btnCloseExamCodeModal) {
      elements.btnCloseExamCodeModal.addEventListener('click', () => {
        elements.modalExamCode.classList.remove('active');
      });
    }
    if (elements.modalExamCode) {
      elements.modalExamCode.addEventListener('click', (e) => {
        if (e.target === elements.modalExamCode) elements.modalExamCode.classList.remove('active');
      });
    }

    // 複製連結
    if (elements.btnCopyShareUrl) {
      elements.btnCopyShareUrl.addEventListener('click', () => {
        const url = elements.publishedShareUrl.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            showToast('📋 測驗分享連結已成功複製至剪貼簿！', 'success');
          });
        } else {
          elements.publishedShareUrl.select();
          document.execCommand('copy');
          showToast('📋 測驗分享連結已成功複製！', 'success');
        }
      });
    }

    // 前往測驗該卷
    if (elements.btnGoToTakeExam) {
      elements.btnGoToTakeExam.addEventListener('click', () => {
        elements.modalExamCode.classList.remove('active');
        const code = elements.publishedCodeDisplay.textContent;
        switchToExamTab(code);
      });
    }

    // 2. 輸入試卷碼開始測驗
    if (elements.btnStartExamByCode) {
      elements.btnStartExamByCode.addEventListener('click', () => {
        const code = (elements.inputExamCode.value || '').trim().toUpperCase();
        if (!code) {
          alert('請輸入班級試卷碼 (例如：K3-8942)');
          return;
        }
        startExamByCode(code);
      });
    }

    // 3. 查看班級統計與排行榜按鈕
    if (elements.btnViewClassReport) {
      elements.btnViewClassReport.addEventListener('click', () => {
        const code = (elements.inputExamCode.value || 'K3-8942').trim().toUpperCase();
        switchToHistoryAndLeaderboard(code);
      });
    }
    if (elements.btnGoToLeaderboard) {
      elements.btnGoToLeaderboard.addEventListener('click', () => {
        const code = currentRunningExam ? currentRunningExam.exam_code : (elements.inputExamCode.value || 'K3-8942');
        switchToHistoryAndLeaderboard(code);
      });
    }

    // 4. 提交線上試卷
    if (elements.btnSubmitExamAnswers) {
      elements.btnSubmitExamAnswers.addEventListener('click', submitExamAnswers);
    }

    // 5. 重新測驗 / 返回代碼輸入頁
    if (elements.btnBackToExamEntry) {
      elements.btnBackToExamEntry.addEventListener('click', () => {
        elements.examResultCard.style.display = 'none';
        elements.examRunnerContainer.style.display = 'none';
        const entryCard = document.querySelector('.exam-entry-card');
        if (entryCard) entryCard.style.display = 'block';
      });
    }
  }

  async function publishWorksheetAsExam() {
    const questions = (lastGeneratedPaperQuestions && lastGeneratedPaperQuestions.length > 0)
      ? lastGeneratedPaperQuestions
      : STARTER_BANK.slice(0, 10).map(b => buildClozeQuestion(b));

    const title = elements.paperTitleInput.value || '國語文班級課堂測驗';
    const subtitle = elements.paperSubtitleInput.value || '教育部課綱核心題型練習';
    const authorName = currentUser ? currentUser.real_name : '語文專任教師';

    let examCode = 'EX-' + Math.floor(1000 + Math.random() * 9000);

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch('/api/exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            title,
            subtitle,
            questions,
            time_limit_minutes: 20,
            user_id: currentUser ? currentUser.id : 'teacher',
            author_name: authorName
          })
        });
        const data = await resp.json();
        if (data.success && data.exam_code) {
          examCode = data.exam_code;
        }
      } catch (err) {
        console.warn('雲端發布試卷失敗，使用本機碼：', err);
      }
    }

    // 蓋印於 A4 試卷右上角
    if (elements.stampExamCodeText) elements.stampExamCodeText.textContent = examCode;
    if (elements.paperExamCodeStamp) elements.paperExamCodeStamp.style.display = 'block';

    // 呈現在彈窗中
    if (elements.publishedCodeDisplay) elements.publishedCodeDisplay.textContent = examCode;
    if (elements.publishedTitleDisplay) elements.publishedTitleDisplay.textContent = title;

    const shareUrl = `${window.location.origin}${window.location.pathname}?exam=${examCode}`;
    if (elements.publishedShareUrl) elements.publishedShareUrl.value = shareUrl;

    // 繪製 QR Code
    if (elements.examQrCanvas) {
      drawExamQrCode(elements.examQrCanvas, shareUrl, examCode);
    }

    if (elements.modalExamCode) elements.modalExamCode.classList.add('active');
    showToast(`🚀 試卷發布成功！班級代碼：${examCode}`, 'success');
  }

  function switchToExamTab(code) {
    elements.tabButtons.forEach(b => b.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    const tabExamBtn = document.getElementById('tabExam');
    const examView = document.getElementById('exam-view');
    if (tabExamBtn) tabExamBtn.classList.add('active');
    if (examView) examView.classList.add('active');

    if (elements.inputExamCode) elements.inputExamCode.value = code;
    startExamByCode(code);
  }

  function switchToHistoryAndLeaderboard(code) {
    elements.tabButtons.forEach(b => b.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    const tabHistoryBtn = document.getElementById('tabHistory');
    const historyView = document.getElementById('history-view');
    if (tabHistoryBtn) tabHistoryBtn.classList.add('active');
    if (historyView) historyView.classList.add('active');

    loadUserHistory();
    loadClassLeaderboard(code);

    setTimeout(() => {
      if (elements.leaderboardTableBody) {
        elements.leaderboardTableBody.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }

  async function startExamByCode(code) {
    let examData = null;

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch(`/api/exam?code=${encodeURIComponent(code)}`);
        const data = await resp.json();
        if (data.success && data.exam) {
          examData = data.exam;
        } else {
          alert(data.error || '找不到該試卷代碼');
          return;
        }
      } catch (err) {
        console.warn('雲端載入試卷失敗：', err);
      }
    }

    // 兜底預設考卷
    if (!examData) {
      examData = {
        exam_code: code,
        title: '康軒版國語 三年級上學期 課堂評量',
        subtitle: '全班標準化指定試卷・教育部課綱字詞',
        author_name: '王大成 老師',
        questions: (lastGeneratedPaperQuestions && lastGeneratedPaperQuestions.length > 0)
          ? lastGeneratedPaperQuestions
          : STARTER_BANK.slice(0, 10).map(b => buildClozeQuestion(b))
      };
    }

    currentRunningExam = examData;
    renderExamRunner(examData);
  }

  function renderExamRunner(exam) {
    const entryCard = document.querySelector('.exam-entry-card');
    if (entryCard) entryCard.style.display = 'none';

    if (elements.examResultCard) elements.examResultCard.style.display = 'none';
    if (elements.examRunnerContainer) elements.examRunnerContainer.style.display = 'block';

    if (elements.examRunnerCodeBadge) elements.examRunnerCodeBadge.textContent = `試卷碼：${exam.exam_code}`;
    if (elements.examRunnerTitle) elements.examRunnerTitle.textContent = exam.title;
    if (elements.examRunnerSubtitle) elements.examRunnerSubtitle.textContent = `${exam.subtitle || ''}・出題教師：${exam.author_name || '語文教師'}`;

    // 啟動計時器
    if (examTimerInterval) clearInterval(examTimerInterval);
    examStartTime = Date.now();
    updateExamTimer();
    examTimerInterval = setInterval(updateExamTimer, 1000);

    // 渲染題目
    elements.examQuestionsList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    exam.questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const card = document.createElement('div');
      card.className = 'exam-q-card';
      card.dataset.index = idx;
      card.dataset.num = qNum;

      const opts = q.options || ['選項A', '選項B', '選項C', '選項D'];

      const optionsHtml = opts.map((opt, oIdx) => `
        <label class="exam-option-item" data-letter="${letters[oIdx]}">
          <input type="radio" name="exam_q_${qNum}" value="${opt}">
          <span class="exam-option-radio"></span>
          <span class="exam-option-label"><b>(${letters[oIdx]})</b> ${opt}</span>
        </label>
      `).join('');

      card.innerHTML = `
        <div class="exam-q-header">
          <span class="exam-q-num">第 ${qNum} 題</span>
          <span class="badge badge-primary">${q.category_name || (q.quizType === 'idiom' ? '情境成語' : '字詞素養')}</span>
        </div>
        <div class="exam-q-prompt">${q.promptSentence || q.example || q.word}</div>
        <div class="exam-options-grid">
          ${optionsHtml}
        </div>
      `;

      elements.examQuestionsList.appendChild(card);
    });

    // 綁定選項點選高亮
    elements.examQuestionsList.querySelectorAll('.exam-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const parentGrid = item.closest('.exam-options-grid');
        parentGrid.querySelectorAll('.exam-option-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    window.scrollTo({ top: elements.examRunnerContainer.offsetTop - 80, behavior: 'smooth' });
  }

  function updateExamTimer() {
    if (!elements.examTimerDisplay) return;
    const elapsedSeconds = Math.floor((Date.now() - examStartTime) / 1000);
    const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const s = (elapsedSeconds % 60).toString().padStart(2, '0');
    elements.examTimerDisplay.textContent = `${m}:${s}`;
  }

  async function submitExamAnswers() {
    if (!currentRunningExam) return;

    const cards = elements.examQuestionsList.querySelectorAll('.exam-q-card');
    const userAnswers = {};
    let unansweredCount = 0;

    cards.forEach(card => {
      const qNum = card.dataset.num;
      const checkedRadio = card.querySelector('input[type="radio"]:checked');
      if (checkedRadio) {
        userAnswers[qNum] = checkedRadio.value;
      } else {
        userAnswers[qNum] = '';
        unansweredCount++;
      }
    });

    if (unansweredCount > 0) {
      if (!confirm(`尚有 ${unansweredCount} 題尚未作答，確定要現在交卷評分嗎？`)) {
        return;
      }
    }

    if (examTimerInterval) clearInterval(examTimerInterval);
    const durationSeconds = Math.max(1, Math.floor((Date.now() - examStartTime) / 1000));

    const studentName = (elements.inputStudentName.value || (currentUser ? currentUser.real_name : '李小明')).trim();
    const seatNumber = (elements.inputSeatNumber.value || '07').trim();

    let resultData = null;

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch('/api/exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit',
            exam_code: currentRunningExam.exam_code,
            user_id: currentUser ? currentUser.id : 'u-student-1',
            student_name: studentName,
            seat_number: seatNumber,
            user_answers: userAnswers,
            duration_seconds: durationSeconds
          })
        });
        const data = await resp.json();
        if (data.success) {
          resultData = data;
        }
      } catch (err) {
        console.warn('雲端評分失敗，使用本機評分：', err);
      }
    }

    if (!resultData) {
      let correct = 0;
      currentRunningExam.questions.forEach((q, idx) => {
        const qNum = idx + 1;
        if (userAnswers[qNum] && userAnswers[qNum] === q.correctAnswer) {
          correct++;
        }
      });
      const score = Math.round((correct / currentRunningExam.questions.length) * 100);
      resultData = {
        score,
        total_questions: currentRunningExam.questions.length,
        correct_count: correct,
        has_mistakes: (correct < currentRunningExam.questions.length)
      };
    }

    // 顯示結果報告卡
    elements.examRunnerContainer.style.display = 'none';
    elements.examResultCard.style.display = 'block';

    elements.examFinalScore.textContent = resultData.score;
    elements.examScoreSummary.textContent = `恭喜考生【${studentName}】完成測驗！全卷共 ${resultData.total_questions} 題，答對 ${resultData.correct_count} 題，作答耗時 ${durationSeconds} 秒。`;

    if (resultData.correct_count < resultData.total_questions) {
      elements.examMistakeNotice.style.display = 'block';
    } else {
      elements.examMistakeNotice.style.display = 'none';
    }

    showToast(`🏆 試卷作答完成！得分：${resultData.score} 分`, 'success');
  }

  // ============================================================================
  // 核心功能 6: 個人學習歷程、錯題本 (Error Notebook) 與六維素養雷達圖
  // ============================================================================
  function initHistoryModule() {
    // 錯題篩選按鈕
    if (elements.filterMistakeAll) {
      elements.filterMistakeAll.addEventListener('click', () => {
        setMistakeFilter('all');
      });
    }
    if (elements.filterMistakePending) {
      elements.filterMistakePending.addEventListener('click', () => {
        setMistakeFilter('pending');
      });
    }
    if (elements.filterMistakeResolved) {
      elements.filterMistakeResolved.addEventListener('click', () => {
        setMistakeFilter('resolved');
      });
    }

    // 關閉重測彈窗
    if (elements.btnCloseRetestModal) {
      elements.btnCloseRetestModal.addEventListener('click', () => {
        elements.modalRetest.classList.remove('active');
      });
    }
    if (elements.modalRetest) {
      elements.modalRetest.addEventListener('click', (e) => {
        if (e.target === elements.modalRetest) elements.modalRetest.classList.remove('active');
      });
    }
  }

  function setMistakeFilter(status) {
    mistakeFilterStatus = status;
    [elements.filterMistakeAll, elements.filterMistakePending, elements.filterMistakeResolved].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (status === 'all' && elements.filterMistakeAll) elements.filterMistakeAll.classList.add('active');
    if (status === 'pending' && elements.filterMistakePending) elements.filterMistakePending.classList.add('active');
    if (status === 'resolved' && elements.filterMistakeResolved) elements.filterMistakeResolved.classList.add('active');

    renderMistakesList();
  }

  async function loadUserHistory() {
    const userId = currentUser ? currentUser.id : 'u-student-1';
    let historyData = null;

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch(`/api/history?user_id=${encodeURIComponent(userId)}`);
        const data = await resp.json();
        if (data.success) {
          historyData = data;
        }
      } catch (err) {
        console.warn('雲端載入學習歷程失敗：', err);
      }
    }

    // 兜底預設指標
    if (!historyData) {
      historyData = {
        stats: {
          total_exams: 3,
          average_score: 91,
          unresolved_mistakes: 2,
          resolved_mistakes: 1
        },
        radar: [
          { dimension: '國字注音辨別力', key: 'zhuyin', score: 88 },
          { dimension: '形音義錯字辨析力', key: 'typo', score: 72 },
          { dimension: '成語生活情境素養', key: 'idiom', score: 94 },
          { dimension: '詞義近義替換力', key: 'synonym', score: 85 },
          { dimension: '短語造句仿寫力', key: 'sentence', score: 90 },
          { dimension: '文意克漏字理解力', key: 'cloze', score: 92 }
        ],
        submissions: [
          {
            exam_code: 'K3-8942',
            score: 90,
            total_questions: 10,
            correct_count: 9,
            duration_seconds: 345,
            submitted_at: new Date().toISOString()
          }
        ],
        mistakes: [
          {
            id: 'm-1',
            exam_code: 'K3-8942',
            quizType: 'typo',
            promptSentence: '「這座新落成的大樓宏偉壯觀，氣勢非凡，真是美【倫】美奐。」',
            wrong_answer: '倫',
            correct_answer: '輪',
            explanation: '「美輪美奐」指建築物高大壯麗。輪：高大；奐：眾多繁華。不得作「美倫美奐」。',
            is_resolved: false
          },
          {
            id: 'm-2',
            exam_code: 'K3-8942',
            quizType: 'zhuyin',
            promptSentence: '請辨別「【提】心吊膽」的正確注音。',
            wrong_answer: 'ㄊㄧˊ',
            correct_answer: 'ㄊㄧˊ',
            explanation: '「提」心吊膽：形容心理十分慌張不安。注音為「ㄊㄧˊ」。',
            is_resolved: false
          },
          {
            id: 'm-3',
            exam_code: 'K3-8942',
            quizType: 'idiom',
            promptSentence: '做事如果不知變通，只是【　　　　】，是不會成功的。',
            wrong_answer: '刻舟求劍',
            correct_answer: '守株待兔',
            explanation: '「守株待兔」比喻不知變通，妄想不勞而獲。',
            is_resolved: true
          }
        ]
      };
    }

    // 填入統計卡片
    if (elements.statTotalExams) elements.statTotalExams.textContent = historyData.stats.total_exams;
    if (elements.statAvgScore) elements.statAvgScore.textContent = `${historyData.stats.average_score} 分`;
    if (elements.statUnresolvedMistakes) elements.statUnresolvedMistakes.textContent = historyData.stats.unresolved_mistakes;
    if (elements.statResolvedMistakes) elements.statResolvedMistakes.textContent = historyData.stats.resolved_mistakes;

    // 繪製六維雷達圖
    if (elements.radarChartCanvas) {
      drawRadarChart(historyData.radar);
    }

    // 歷次成績清單
    renderSubmissionsList(historyData.submissions || []);

    // 錯題本清單
    cachedMistakesList = historyData.mistakes || [];
    renderMistakesList();
  }

  function renderSubmissionsList(submissions) {
    if (!elements.historySubmissionsList) return;
    elements.historySubmissionsList.innerHTML = '';

    if (submissions.length === 0) {
      elements.historySubmissionsList.innerHTML = `
        <div style="text-align:center; padding:32px 12px; color:var(--text-muted);">
          <span>📝 尚未參加過班級試卷測驗，歡迎使用試卷代碼進行測驗！</span>
        </div>
      `;
      return;
    }

    submissions.forEach(s => {
      const card = document.createElement('div');
      card.style.cssText = 'padding:14px; border-radius:12px; border:1px solid var(--border-color); background:var(--bg-card); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';

      const dateStr = s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '剛才';
      const badgeColor = s.score >= 80 ? 'badge-success' : (s.score >= 60 ? 'badge-primary' : 'badge-danger');

      card.innerHTML = `
        <div>
          <div style="font-weight:700; font-size:1rem; display:flex; align-items:center; gap:8px;">
            <span class="badge badge-primary">${s.exam_code}</span>
            <span>國語文課堂測驗</span>
          </div>
          <div style="font-size:0.84rem; color:var(--text-muted); margin-top:4px;">
            交卷時間：${dateStr}・花費：${s.duration_seconds || 60} 秒・答對：${s.correct_count}/${s.total_questions} 題
          </div>
        </div>
        <div>
          <span class="badge ${badgeColor}" style="font-size:1.15rem; font-weight:800; padding:6px 14px;">
            ${s.score} 分
          </span>
        </div>
      `;
      elements.historySubmissionsList.appendChild(card);
    });
  }

  function renderMistakesList() {
    if (!elements.mistakesListContainer) return;
    elements.mistakesListContainer.innerHTML = '';

    let list = cachedMistakesList;
    if (mistakeFilterStatus === 'pending') {
      list = list.filter(m => !m.is_resolved);
    } else if (mistakeFilterStatus === 'resolved') {
      list = list.filter(m => m.is_resolved);
    }

    if (list.length === 0) {
      elements.mistakesListContainer.innerHTML = `
        <div style="text-align:center; padding:40px 16px; color:var(--text-muted);">
          <div style="font-size:2.4rem; margin-bottom:8px;">✨</div>
          <div style="font-weight:700; font-size:1.05rem;">太優秀了！目前沒有待克服的錯題！</div>
        </div>
      `;
      return;
    }

    list.forEach(m => {
      const card = document.createElement('div');
      card.className = 'mistake-card-item';
      card.style.cssText = 'padding:18px; border-radius:12px; border:1px solid var(--border-color); background:var(--bg-card); margin-bottom:14px; position:relative;';

      const typeLabels = {
        zhuyin: '國字注音',
        typo: '錯字訂正',
        idiom: '成語素養',
        situational: '情境成語',
        synonym: '近義辨析',
        sentence: '短語仿寫',
        cloze: '克漏理解'
      };

      const statusBadge = m.is_resolved
        ? '<span class="badge badge-success">✅ 已掌握克服</span>'
        : '<span class="badge badge-danger">⚠️ 待克服強化</span>';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="badge badge-primary">${typeLabels[m.quizType] || '語文評量'}</span>
            <span style="font-size:0.86rem; color:var(--text-muted);">出處試卷：${m.exam_code}</span>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div style="font-weight:700; font-size:1.02rem; margin-bottom:12px; line-height:1.6;">
          ${m.promptSentence || m.prompt || '題目題幹'}
        </div>
        <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:0.92rem; background:rgba(0,0,0,0.02); padding:10px 14px; border-radius:8px; margin-bottom:12px;">
          <div style="color:var(--danger); font-weight:600;">❌ 您的原答：${m.wrong_answer || '未填寫'}</div>
          <div style="color:var(--success); font-weight:700;">✅ 正確解答：${m.correct_answer}</div>
        </div>
        <div style="font-size:0.88rem; color:var(--text-muted); margin-bottom:14px;">
          <b>💡 考點解析：</b>${m.explanation || '請記住標準用法並加以鞏固。'}
        </div>
        <div style="text-align:right;">
          ${m.is_resolved
            ? '<button class="btn btn-sm btn-outline" disabled style="opacity:0.6;">已完全掌握</button>'
            : `<button class="btn btn-sm btn-primary btn-trigger-retest" data-id="${m.id}">🎯 立即重測克服</button>`
          }
        </div>
      `;

      elements.mistakesListContainer.appendChild(card);
    });

    // 綁定重測事件
    elements.mistakesListContainer.querySelectorAll('.btn-trigger-retest').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const targetMistake = cachedMistakesList.find(m => m.id === id);
        if (targetMistake) {
          openRetestModal(targetMistake);
        }
      });
    });
  }

  function openRetestModal(mistake) {
    currentRetestItem = mistake;
    const body = elements.retestModalBody;
    if (!body) return;

    // 產生干擾選項
    const distractors = ['不脛而走', '迫不及待', '按部就班', '美輪美奐', '委曲求全'].filter(w => w !== mistake.correct_answer).slice(0, 3);
    const options = shuffleArray([mistake.correct_answer, ...distractors]);

    body.innerHTML = `
      <div style="margin-bottom:16px;">
        <span class="badge badge-primary">${mistake.quizType || '弱點強化'}</span>
        <h4 style="font-size:1.15rem; font-weight:800; margin-top:8px;">${mistake.promptSentence || '請選出正確答案：'}</h4>
      </div>
      <div class="exam-options-grid" style="margin-bottom:20px;">
        ${options.map((opt, idx) => `
          <label class="exam-option-item" data-val="${opt}">
            <input type="radio" name="retestChoice" value="${opt}">
            <span class="exam-option-radio"></span>
            <span class="exam-option-label"><b>(${['A', 'B', 'C', 'D'][idx]})</b> ${opt}</span>
          </label>
        `).join('')}
      </div>
      <div style="text-align:right;">
        <button id="btnSubmitRetestAnswer" class="btn btn-success" style="padding:10px 32px;">
          🚀 確認提交答案
        </button>
      </div>
    `;

    body.querySelectorAll('.exam-option-item').forEach(item => {
      item.addEventListener('click', () => {
        body.querySelectorAll('.exam-option-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    const btnSubmit = document.getElementById('btnSubmitRetestAnswer');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', submitRetestAnswer);
    }

    if (elements.modalRetest) elements.modalRetest.classList.add('active');
  }

  async function submitRetestAnswer() {
    if (!currentRetestItem) return;
    const checked = elements.retestModalBody.querySelector('input[name="retestChoice"]:checked');
    if (!checked) {
      alert('請先點選一個答案！');
      return;
    }

    const selectedVal = checked.value;
    const isCorrect = (selectedVal === currentRetestItem.correct_answer);

    if (isCorrect) {
      if (window.location.protocol.startsWith('http')) {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resolve_mistake', mistake_id: currentRetestItem.id })
          });
        } catch (e) {
          console.warn('雲端更新錯題失敗：', e);
        }
      }

      currentRetestItem.is_resolved = true;
      if (elements.modalRetest) elements.modalRetest.classList.remove('active');
      showToast('🎉 答對了！恭喜您成功克服該題弱點！', 'success');
      loadUserHistory();
    } else {
      alert(`💡 排序或答案稍有偏差！正確答案應為【${currentRetestItem.correct_answer}】。請再仔細複習解析！`);
    }
  }

  async function loadClassLeaderboard(code = 'K3-8942') {
    if (!elements.leaderboardTableBody) return;
    elements.leaderboardTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">載入英雄榜中...</td></tr>';

    let leaderboard = [];

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch(`/api/exam?code=${encodeURIComponent(code)}&report=true`);
        const data = await resp.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          leaderboard = data.leaderboard;
        }
      } catch (err) {
        console.warn('雲端載入排行榜失敗：', err);
      }
    }

    if (leaderboard.length === 0) {
      leaderboard = [
        { rank: 1, seat_number: '12', student_name: '陳姿穎', score: 100, duration_seconds: 142, submitted_at: new Date().toISOString() },
        { rank: 2, seat_number: '07', student_name: '李小明', score: 90, duration_seconds: 185, submitted_at: new Date().toISOString() },
        { rank: 3, seat_number: '18', student_name: '張家豪', score: 90, duration_seconds: 210, submitted_at: new Date().toISOString() },
        { rank: 4, seat_number: '03', student_name: '林冠宇', score: 80, duration_seconds: 260, submitted_at: new Date().toISOString() },
        { rank: 5, seat_number: '21', student_name: '黃雅筑', score: 70, duration_seconds: 310, submitted_at: new Date().toISOString() }
      ];
    }

    elements.leaderboardTableBody.innerHTML = '';
    leaderboard.forEach(item => {
      const tr = document.createElement('tr');
      let medal = `#${item.rank}`;
      if (item.rank === 1) medal = '🥇 冠軍';
      else if (item.rank === 2) medal = '🥈 亞軍';
      else if (item.rank === 3) medal = '🥉 季軍';

      const timeStr = item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '今天';

      tr.innerHTML = `
        <td style="font-weight:800; color:var(--primary);">${medal}</td>
        <td>${item.seat_number || '-'}</td>
        <td style="font-weight:700;">${item.student_name}</td>
        <td><span class="badge ${item.score >= 90 ? 'badge-success' : 'badge-primary'}" style="font-weight:800;">${item.score} 分</span></td>
        <td>${item.duration_seconds || 60} 秒</td>
        <td style="color:var(--text-muted); font-size:0.86rem;">${timeStr}</td>
      `;
      elements.leaderboardTableBody.appendChild(tr);
    });
  }

  // ============================================================================
  // 核心功能 7: 教師線上多人協作成題目與審核工作流
  // ============================================================================
  function initCollabModule() {
    if (elements.btnOpenCreateQuestion) {
      elements.btnOpenCreateQuestion.addEventListener('click', () => {
        if (elements.modalAddQuestion) elements.modalAddQuestion.classList.add('active');
      });
    }

    if (elements.btnCloseAddQModal) {
      elements.btnCloseAddQModal.addEventListener('click', () => {
        if (elements.modalAddQuestion) elements.modalAddQuestion.classList.remove('active');
      });
    }
    if (elements.modalAddQuestion) {
      elements.modalAddQuestion.addEventListener('click', (e) => {
        if (e.target === elements.modalAddQuestion) elements.modalAddQuestion.classList.remove('active');
      });
    }

    // 篩選按鈕
    if (elements.filterCollabAll) {
      elements.filterCollabAll.addEventListener('click', () => setCollabFilter('all'));
    }
    if (elements.filterCollabPending) {
      elements.filterCollabPending.addEventListener('click', () => setCollabFilter('pending'));
    }
    if (elements.filterCollabApproved) {
      elements.filterCollabApproved.addEventListener('click', () => setCollabFilter('approved'));
    }

    // 建立新題目表單提交
    if (elements.formAddCustomQuestion) {
      elements.formAddCustomQuestion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const quiz_type = elements.addQType.value;
        const press = elements.addQPress.value;
        const grade = elements.addQGrade.value;
        const lesson_num = elements.addQLesson.value || 1;
        const prompt = elements.addQPrompt.value.trim();
        const correct_answer = elements.addQCorrectAns.value.trim();
        const distractorsRaw = elements.addQDistractors.value.trim();
        const explanation = elements.addQExplanation.value.trim();

        const distractors = distractorsRaw ? distractorsRaw.split(/[,，]/).map(s => s.trim()).filter(Boolean) : ['選項A', '選項B', '選項C'];
        const options = shuffleArray([correct_answer, ...distractors]);

        const authorName = currentUser ? currentUser.real_name : '協作教師';
        const userId = currentUser ? currentUser.id : 'u-teacher-1';

        const payload = {
          action: 'create',
          created_by: userId,
          author_name: authorName,
          quiz_type,
          press,
          grade,
          lesson_num,
          prompt,
          options,
          correct_answer,
          explanation
        };

        if (window.location.protocol.startsWith('http')) {
          try {
            const resp = await fetch('/api/collaborate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (data.success) {
              showToast('📤 題目提交成功！已進入協作審核池！', 'success');
              if (elements.modalAddQuestion) elements.modalAddQuestion.classList.remove('active');
              elements.formAddCustomQuestion.reset();
              loadCollabQuestions();
              return;
            }
          } catch (err) {
            console.warn('雲端提交題目失敗：', err);
          }
        }

        showToast('📤 題目已成功建立！', 'success');
        if (elements.modalAddQuestion) elements.modalAddQuestion.classList.remove('active');
        elements.formAddCustomQuestion.reset();
        loadCollabQuestions();
      });
    }
  }

  function setCollabFilter(status) {
    collabFilterStatus = status;
    [elements.filterCollabAll, elements.filterCollabPending, elements.filterCollabApproved].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (status === 'all' && elements.filterCollabAll) elements.filterCollabAll.classList.add('active');
    if (status === 'pending' && elements.filterCollabPending) elements.filterCollabPending.classList.add('active');
    if (status === 'approved' && elements.filterCollabApproved) elements.filterCollabApproved.classList.add('active');

    renderCollabList();
  }

  async function loadCollabQuestions() {
    let collabData = null;

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch(`/api/collaborate?status=${encodeURIComponent(collabFilterStatus)}`);
        const data = await resp.json();
        if (data.success) {
          collabData = data;
        }
      } catch (err) {
        console.warn('雲端載入協作題庫失敗：', err);
      }
    }

    if (!collabData) {
      collabData = {
        stats: { total: 3, pending: 1, approved: 2 },
        questions: [
          {
            id: 'cq-1',
            quiz_type: 'cloze',
            press: '康軒版',
            grade: 3,
            lesson_num: 1,
            author_name: '王大成 老師',
            prompt: '【校本素養】校園生態池邊的垂柳隨著微風【　　　　】，景色十分宜人。',
            correct_answer: '輕輕搖曳',
            options_json: JSON.stringify(['輕輕搖曳', '大呼小叫', '呆若木雞', '火冒三丈']),
            explanation: '形容垂柳在微風中優雅輕擺的姿態。',
            status: 'approved',
            created_at: new Date().toISOString()
          },
          {
            id: 'cq-2',
            quiz_type: 'typo',
            press: '南一版',
            grade: 4,
            lesson_num: 3,
            author_name: '張簡秀蘭 老師',
            prompt: '「經過大家集思廣益，終於在比賽中出奇【制】勝奪得冠軍。」（請挑出錯字）',
            correct_answer: '制（正確應為「致」）',
            options_json: JSON.stringify(['制（正確應為「致」）', '益', '廣', '勝']),
            explanation: '「出奇制勝」指用奇兵奇計戰勝敵人。',
            status: 'approved',
            created_at: new Date().toISOString()
          },
          {
            id: 'cq-3',
            quiz_type: 'situational',
            press: '翰林版',
            grade: 5,
            lesson_num: 5,
            author_name: '陳怡君 老師',
            prompt: '「運動會接力賽中，全班同學同心協力、奮勇直前，最後在倒數時刻反超逆轉，這正是【　　　　】的最好寫照。」',
            correct_answer: '後來居上',
            options_json: JSON.stringify(['後來居上', '名落孫山', '自相矛盾', '守株待兔']),
            explanation: '形容後起的人表現超越前面的人。',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]
      };
    }

    if (elements.collabTotalCount) elements.collabTotalCount.textContent = collabData.stats.total;
    if (elements.collabPendingCount) elements.collabPendingCount.textContent = collabData.stats.pending;
    if (elements.collabApprovedCount) elements.collabApprovedCount.textContent = collabData.stats.approved;

    cachedCollabList = collabData.questions || [];
    renderCollabList();
  }

  function renderCollabList() {
    if (!elements.collabQuestionsContainer) return;
    elements.collabQuestionsContainer.innerHTML = '';

    let list = cachedCollabList;
    if (collabFilterStatus === 'pending') {
      list = list.filter(q => q.status === 'pending');
    } else if (collabFilterStatus === 'approved') {
      list = list.filter(q => q.status === 'approved');
    }

    if (list.length === 0) {
      elements.collabQuestionsContainer.innerHTML = `
        <div style="text-align:center; padding:36px; color:var(--text-muted);">
          <span>目前無相關協作題目，歡迎點擊上方「➕ 新增協作題目」創建！</span>
        </div>
      `;
      return;
    }

    const isTeacherRole = (currentUser && currentUser.role === 'teacher') || true; // 示範環境皆可操作審核

    list.forEach(q => {
      const card = document.createElement('div');
      card.style.cssText = 'padding:18px; border-radius:12px; border:1px solid var(--border-color); background:var(--bg-card); margin-bottom:14px;';

      const statusBadge = q.status === 'approved'
        ? '<span class="badge badge-success">✅ 已發布入庫</span>'
        : '<span class="badge badge-warning">⏳ 待審核 (Pending)</span>';

      let optionsList = [];
      try {
        optionsList = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : (q.options || []);
      } catch (e) {
        optionsList = [q.correct_answer];
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="badge badge-primary">${q.press || '通用版'} ${q.grade || 3}年級 第${q.lesson_num || 1}課</span>
            <span style="font-size:0.86rem; color:var(--text-muted);">出題者：<b>${q.author_name || '老師'}</b></span>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div style="font-weight:700; font-size:1.05rem; margin-bottom:10px; line-height:1.6;">
          ${q.prompt}
        </div>
        <div style="background:rgba(0,0,0,0.02); padding:10px 14px; border-radius:8px; margin-bottom:10px; font-size:0.9rem;">
          <div style="color:var(--success); font-weight:700; margin-bottom:4px;">🎯 正確答案：${q.correct_answer}</div>
          <div style="color:var(--text-muted);">備選選項：${optionsList.join('、')}</div>
        </div>
        ${q.explanation ? `<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:14px;">💡 <b>出題解析：</b>${q.explanation}</div>` : ''}
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          ${(q.status === 'pending' && isTeacherRole)
            ? `
              <button class="btn btn-sm btn-success btn-approve-q" data-id="${q.id}">✅ 審核通過 (入庫)</button>
              <button class="btn btn-sm btn-outline btn-reject-q" data-id="${q.id}">❌ 退回修改</button>
            `
            : ''
          }
        </div>
      `;

      elements.collabQuestionsContainer.appendChild(card);
    });

    // 審核按鈕事件綁定
    elements.collabQuestionsContainer.querySelectorAll('.btn-approve-q').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (window.location.protocol.startsWith('http')) {
          try {
            await fetch('/api/collaborate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'approve', id, reviewer_id: currentUser ? currentUser.id : 'teacher' })
            });
          } catch (e) {
            console.warn('雲端審核失敗：', e);
          }
        }
        showToast('✅ 審核通過！該題已正式納入全校題庫與試卷產生器！', 'success');
        const item = cachedCollabList.find(q => q.id === id);
        if (item) item.status = 'approved';
        loadCollabQuestions();
      });
    });

    elements.collabQuestionsContainer.querySelectorAll('.btn-reject-q').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (window.location.protocol.startsWith('http')) {
          try {
            await fetch('/api/collaborate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'reject', id, reviewer_id: currentUser ? currentUser.id : 'teacher' })
            });
          } catch (e) {
            console.warn('雲端審核失敗：', e);
          }
        }
        showToast('❌ 該題已退回協作者修改。', 'info');
        cachedCollabList = cachedCollabList.filter(q => q.id !== id);
        loadCollabQuestions();
      });
    });
  }

  // ============================================================================
  // Canvas 圖形引擎：六維雷達圖 (Radar Chart) & QR Code 矩陣繪製
  // ============================================================================
  function drawRadarChart(radarData) {
    const canvas = elements.radarChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = 135;
    const dimensions = radarData || [
      { dimension: '國字注音辨別力', key: 'zhuyin', score: 85 },
      { dimension: '形音義錯字辨析力', key: 'typo', score: 70 },
      { dimension: '成語生活情境素養', key: 'idiom', score: 90 },
      { dimension: '詞義近義替換力', key: 'synonym', score: 80 },
      { dimension: '短語造句仿寫力', key: 'sentence', score: 88 },
      { dimension: '文意克漏字理解力', key: 'cloze', score: 92 }
    ];
    const n = dimensions.length;

    // 1. 繪製六角同心格網 (20%, 40%, 60%, 80%, 100%)
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    levels.forEach(level => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI / n) - (Math.PI / 2);
        const r = maxRadius * level;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = (level === 1.0) ? 'rgba(99, 102, 241, 0.45)' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 2. 繪製輻射軸線與標籤
    ctx.font = 'bold 12px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < n; i++) {
      const angle = (i * 2 * Math.PI / n) - (Math.PI / 2);
      const x = cx + maxRadius * Math.cos(angle);
      const y = cy + maxRadius * Math.sin(angle);

      // 輻射線
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 文字標籤
      const labelDist = maxRadius + 28;
      const lx = cx + labelDist * Math.cos(angle);
      const ly = cy + labelDist * Math.sin(angle);
      ctx.fillStyle = '#4338ca';
      ctx.fillText(dimensions[i].dimension, lx, ly);
    }

    // 3. 繪製得分多邊形
    ctx.beginPath();
    const points = [];
    for (let i = 0; i < n; i++) {
      const angle = (i * 2 * Math.PI / n) - (Math.PI / 2);
      const score = Math.min(100, Math.max(20, dimensions[i].score || 80));
      const r = maxRadius * (score / 100);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      points.push({ x: px, y: py, score });

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // 漸層填色
    const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.55)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 外邊框
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. 繪製頂點圓點與得分數值
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4f46e5';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 分數標籤
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${p.score}分`, p.x, p.y - 10);
    });
  }

  function drawExamQrCode(canvas, shareUrl, examCode) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const gridSize = 25;
    const cellSize = Math.floor((w - 20) / gridSize);
    const offsetX = Math.floor((w - cellSize * gridSize) / 2);
    const offsetY = Math.floor((h - cellSize * gridSize) / 2);

    ctx.fillStyle = '#1e1b4b';

    // 繪製定位點 (Finder Pattern) 7x7
    function drawFinder(r, c) {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const isOuter = (i === 0 || i === 6 || j === 0 || j === 6);
          const isInner = (i >= 2 && i <= 4 && j >= 2 && j <= 4);
          if (isOuter || isInner) {
            ctx.fillRect(offsetX + (c + j) * cellSize, offsetY + (r + i) * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);

    // 定位校準點 5x5
    const ar = gridSize - 9;
    const ac = gridSize - 9;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (i === 0 || i === 4 || j === 0 || j === 4 || (i === 2 && j === 2)) {
          ctx.fillRect(offsetX + (ac + j) * cellSize, offsetY + (ar + i) * cellSize, cellSize, cellSize);
        }
      }
    }

    // 時序軌跡
    for (let i = 8; i < gridSize - 8; i += 2) {
      ctx.fillRect(offsetX + 6 * cellSize, offsetY + i * cellSize, cellSize, cellSize);
      ctx.fillRect(offsetX + i * cellSize, offsetY + 6 * cellSize, cellSize, cellSize);
    }

    // 擬真雜湊資料點
    let hash = 0;
    const str = shareUrl + examCode;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const inFinder1 = (r < 8 && c < 8);
        const inFinder2 = (r < 8 && c >= gridSize - 8);
        const inFinder3 = (r >= gridSize - 8 && c < 8);
        const inCenter = (r >= 10 && r <= 14 && c >= 10 && c <= 14);
        if (!inFinder1 && !inFinder2 && !inFinder3 && !inCenter) {
          const bit = Math.abs(Math.sin((r * 31 + c * 17) ^ hash)) > 0.48;
          if (bit) {
            ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // 中心試卷代碼徽章
    const centerSize = cellSize * 5;
    const cx = offsetX + 10 * cellSize;
    const cy = offsetY + 10 * cellSize;
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.roundRect(cx, cy, centerSize, centerSize, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXAM', cx + centerSize / 2, cy + centerSize / 2);
  }

  // ============================================================================
  // URL 深度連結辨識 (如 ?exam=K3-8942 或 #exam/K3-8942 自動直達)
  // ============================================================================
  function checkUrlDeepLink() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let examCode = urlParams.get('exam');

      if (!examCode && window.location.hash.startsWith('#exam/')) {
        examCode = window.location.hash.replace('#exam/', '');
      }

      if (examCode) {
        setTimeout(() => {
          switchToExamTab(examCode.toUpperCase());
          showToast(`🏷️ 自動帶入測驗碼：${examCode.toUpperCase()}`, 'info');
        }, 300);
      }
    } catch (e) {
      console.warn('深度連結解析失敗：', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // 兜底保證：超時 4 秒自動淡出遮罩
  setTimeout(() => {
    const loader = document.getElementById('appLoader');
    if (loader && loader.style.display !== 'none') {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 300);
    }
  }, 4000);
})();
