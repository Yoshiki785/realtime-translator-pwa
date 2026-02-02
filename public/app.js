// Firebase configuration is loaded from firebase-config.js (window.FIREBASE_CONFIG)
const runtimeFirebaseConfig = window.FIREBASE_CONFIG || {};

// ========== i18n: Multi-language strings ==========
const STRINGS = {
  ja: {
    login: 'ログイン',
    logout: 'ログアウト',
    settings: '設定',
    usageStatus: '利用状況',
    save: '保存',
    close: '閉じる',
    transcriptLog: '原文ログ',
    translationLog: '翻訳ログ',
    historyCreatedLabel: '作成日時: ',
    historyLangLabel: '言語: ',
    historyDurationLabel: '所要: ',
    historyUtterancesLabel: '発話数: ',
    historyExpired: '期限切れのため表示できません',
    historyEmptyFiltered: '期限切れの履歴は非表示です',
    historyNoOriginal: '（原文なし）',
    historyNoTranslation: '（翻訳なし）',
    preset: 'プリセット:',
    presetFast: '速い',
    presetBalanced: 'バランス',
    presetStable: '安定',
    uiLangLabel: '表示言語',
    inputLangLabel: '入力言語',
    outputLangLabel: '出力言語',
    langAuto: '自動検出',
    errorFirebaseInit: 'Firebase初期化に失敗しました。設定を確認してください。',
    errorLoginRequired: 'ログインが必要です',
    errorLoginFailed: 'ログインに失敗しました: ',
    errorLogoutFailed: 'ログアウトに失敗しました: ',
    errorTranslation: '翻訳に失敗しました',
    errorQuotaCheck: '利用可能時間の確認に失敗しました。しばらくしてから再試行してください。',
    errorMonthlyExhausted: '今月の利用可能時間が残っていません。',
    errorDailyLimit: 'Freeプランの本日の利用上限(10分)に達しました。',
    planLabel: 'プラン:',
    monthlyRemaining: '月間残り:',
    ticketBalance: 'チケット残高:',
    total: '合計:',
    nextReset: '次回リセット:',
    today: '本日:',
    thisMonth: '今月:',
    remaining: '残り:',
    minutes: '分',
    glossaryLabel: '辞書（用語集）',
    glossaryHint: '1行1エントリ：source=target',
    takeoverTitle: '別端末で使用中です',
    takeoverMessage: '別端末で翻訳が実行中です。別端末でStopしてから、この端末でStartしてください。',
    takeoverStart: 'この端末で開始（他を停止）',
    takeoverKeep: '閉じる',
    upgradeToPro: 'Proにアップグレード',
    upgrading: '処理中...',
    billingSuccess: 'アップグレード完了！',
    billingPending: 'プラン反映中...',
    billingSyncDelayed: '反映に時間がかかっています。しばらくして再読込してください。',
    billingCancelled: 'キャンセルしました',
    billingError: 'エラーが発生しました',
    alreadyPro: 'Proプラン利用中',
    manageSubscription: 'サブスク管理',
    buyTicket: '追加購入',
    buyTicketProOnly: '追加購入（Pro限定）',
    proRequiredHint: 'Proプランのみ購入可能です。アップグレードしてください。',
    purchasing: '購入中...',
    ticketSuccess: 'チケット購入完了！',
    ticketCancelled: '購入キャンセル',
    ticketSelectTitle: '追加チケットを選択',
    ticketCheckoutError: '決済を開始できませんでした',
    proRequired: 'Proプランのみ購入可能',
    billingStatusFree: 'Freeプラン',
    billingStatusPro: 'Proプラン',
    billingStatusCanceling: '解約予定（{date}まで有効）',
    billingStatusPastDue: '⚠️ 支払いが滞っています。お支払い方法を更新してください。',
    billingStatusActive: '有効（次回更新: {date}）',
    companyInfo: '会社情報',
    companyNote: '※ Stripeの請求先情報・解約は「サブスク管理」から行えます',
    companyName: '会社名',
    department: '部署',
    position: '役職',
    companyAddress: '住所',
    postalCode: '郵便番号',
    country: '国',
    taxIdLabel: '税ID種別',
    taxIdValue: '税ID値',
    saveCompany: '保存',
    editCompany: '会社情報を編集',
    companySaved: '保存しました',
    companySavedWithStripe: '保存しました（Stripe同期完了）',
    companySavedStripeSkipped: '保存しました（Stripe未同期）',
    companySaveError: '保存に失敗しました',
    errorPromptInjection: '不正な入力パターンが検出されました。入力を確認してください。',
    errorNoTextToSummarize: '要約するテキストがありません',
    errorSummaryFailed: '要約の生成に失敗しました',
    errorInputTooLong: '入力が長すぎます（上限を超えました）',
    networkDisconnected: '接続が切れました。テキストは保存されています。ネットワーク復帰後に再度 Start してください。',
    errorRateLimit: 'リクエスト制限中です。しばらく待ってから再試行してください。',
    errorServerError: 'サーバーエラーが発生しました。時間をおいて再試行してください。',
  },
  en: {
    login: 'Login',
    logout: 'Logout',
    settings: 'Settings',
    usageStatus: 'Usage',
    save: 'Save',
    close: 'Close',
    transcriptLog: 'Transcript',
    translationLog: 'Translation',
    historyCreatedLabel: 'Created: ',
    historyLangLabel: 'Languages: ',
    historyDurationLabel: 'Duration: ',
    historyUtterancesLabel: 'Utterances: ',
    historyExpired: 'This entry has expired and cannot be displayed.',
    historyEmptyFiltered: 'Expired history entries are hidden.',
    historyNoOriginal: '(no original)',
    historyNoTranslation: '(no translation)',
    preset: 'Preset:',
    presetFast: 'Fast',
    presetBalanced: 'Balanced',
    presetStable: 'Stable',
    uiLangLabel: 'Display Language',
    inputLangLabel: 'Input Language',
    outputLangLabel: 'Output Language',
    langAuto: 'Auto-detect',
    errorFirebaseInit: 'Firebase initialization failed. Please check configuration.',
    errorLoginRequired: 'Login required',
    errorLoginFailed: 'Login failed: ',
    errorLogoutFailed: 'Logout failed: ',
    errorTranslation: 'Translation failed',
    errorQuotaCheck: 'Failed to check available time. Please try again later.',
    errorMonthlyExhausted: 'No remaining time this month.',
    errorDailyLimit: 'Daily limit (10 min) reached for Free plan.',
    planLabel: 'Plan:',
    monthlyRemaining: 'Monthly:',
    ticketBalance: 'Tickets:',
    total: 'Total:',
    nextReset: 'Next Reset:',
    today: 'Today:',
    thisMonth: 'Month:',
    remaining: 'Remaining:',
    minutes: 'min',
    glossaryLabel: 'Glossary',
    glossaryHint: 'One per line: source=target',
    takeoverTitle: 'Translation is active elsewhere',
    takeoverMessage: 'Another device is translating. Please stop it there, then start here.',
    takeoverStart: 'Start on this device (stop others)',
    takeoverKeep: 'Close',
    upgradeToPro: 'Upgrade to Pro',
    upgrading: 'Processing...',
    billingSuccess: 'Upgrade complete!',
    billingPending: 'Applying plan...',
    billingSyncDelayed: 'Sync is taking longer. Please reload in a moment.',
    billingCancelled: 'Cancelled',
    billingError: 'An error occurred',
    alreadyPro: 'Pro plan active',
    manageSubscription: 'Manage Subscription',
    buyTicket: 'Buy Add-on',
    buyTicketProOnly: 'Buy Add-on (Pro only)',
    proRequiredHint: 'Available for Pro plans only. Please upgrade.',
    purchasing: 'Purchasing...',
    ticketSuccess: 'Ticket purchased!',
    ticketCancelled: 'Purchase cancelled',
    ticketSelectTitle: 'Select ticket pack',
    ticketCheckoutError: 'Failed to start checkout',
    proRequired: 'Pro only',
    billingStatusFree: 'Free Plan',
    billingStatusPro: 'Pro Plan',
    billingStatusCanceling: 'Canceling (valid until {date})',
    billingStatusPastDue: '⚠️ Payment overdue. Please update your payment method.',
    billingStatusActive: 'Active (renews: {date})',
    companyInfo: 'Company Info',
    companyNote: '* For billing & cancellation, use "Manage Subscription"',
    companyName: 'Company Name',
    department: 'Department',
    position: 'Position',
    companyAddress: 'Address',
    postalCode: 'Postal Code',
    country: 'Country',
    taxIdLabel: 'Tax ID Type',
    taxIdValue: 'Tax ID',
    saveCompany: 'Save',
    editCompany: 'Edit Company Info',
    companySaved: 'Saved',
    companySavedWithStripe: 'Saved (Stripe synced)',
    companySavedStripeSkipped: 'Saved (Stripe not synced)',
    companySaveError: 'Failed to save',
    errorPromptInjection: 'Invalid input pattern detected. Please check your input.',
    errorNoTextToSummarize: 'No text to summarize',
    errorSummaryFailed: 'Failed to generate summary',
    errorInputTooLong: 'Input is too long (exceeded limit)',
    networkDisconnected: 'Connection lost. Your text is saved. Please reconnect and press Start again.',
    errorRateLimit: 'Rate limited. Please wait and try again.',
    errorServerError: 'Server error. Please try again later.',
  },
  'zh-Hans': {
    login: '登录',
    logout: '登出',
    settings: '设置',
    usageStatus: '使用情况',
    save: '保存',
    close: '关闭',
    transcriptLog: '原文日志',
    translationLog: '翻译日志',
    // 拼音: Chuàngjiàn shíjiān：
    // 日本語訳: 作成日時:
    historyCreatedLabel: '创建时间：',
    // 拼音: Yǔyán：
    // 日本語訳: 言語:
    historyLangLabel: '语言：',
    // 拼音: Shícháng：
    // 日本語訳: 所要:
    historyDurationLabel: '时长：',
    // 拼音: Fāhuà shù：
    // 日本語訳: 発話数:
    historyUtterancesLabel: '发话数：',
    // 拼音: Lìshǐ yǐ guòqí, wúfǎ xiǎnshì.
    // 日本語訳: 期限切れのため表示できません。
    historyExpired: '历史已过期，无法显示。',
    // 拼音: Guòqí jìlù yǐ yǐncáng.
    // 日本語訳: 期限切れの履歴は非表示です。
    historyEmptyFiltered: '过期记录已隐藏。',
    // 拼音: （Wú yuánwén）
    // 日本語訳: （原文なし）
    historyNoOriginal: '（无原文）',
    // 拼音: （Wú fānyì）
    // 日本語訳: （翻訳なし）
    historyNoTranslation: '（无翻译）',
    preset: '预设:',
    presetFast: '快速',
    presetBalanced: '平衡',
    presetStable: '稳定',
    uiLangLabel: '显示语言',
    inputLangLabel: '输入语言',
    outputLangLabel: '输出语言',
    langAuto: '自动检测',
    errorFirebaseInit: 'Firebase初始化失败，请检查配置。',
    errorLoginRequired: '需要登录',
    errorLoginFailed: '登录失败: ',
    errorLogoutFailed: '登出失败: ',
    errorTranslation: '翻译失败',
    errorQuotaCheck: '无法确认可用时间，请稍后重试。',
    errorMonthlyExhausted: '本月可用时间已用完。',
    errorDailyLimit: '免费版今日使用上限(10分钟)已达到。',
    planLabel: '计划:',
    monthlyRemaining: '月剩余:',
    ticketBalance: '票券余额:',
    total: '合计:',
    nextReset: '下次重置:',
    today: '今日:',
    thisMonth: '本月:',
    remaining: '剩余:',
    minutes: '分钟',
    glossaryLabel: '词汇表',
    glossaryHint: '每行一条：source=target',
    takeoverTitle: '其他设备正在使用',
    takeoverMessage: '另一台设备正在翻译。请在那里停止，然后在这里开始。',
    takeoverStart: '在此设备开始（停止其他）',
    takeoverKeep: '关闭',
    upgradeToPro: '升级到Pro',
    upgrading: '处理中...',
    billingSuccess: '升级完成！',
    billingPending: '正在应用计划...',
    // 拼音: Tóngbù xūyào yìxiē shíjiān. Qǐng shāohòu shuāxīn.
    // 日本語訳: 反映に時間がかかっています。しばらくして再読込してください。
    billingSyncDelayed: '同步需要一些时间。请稍后刷新。',
    billingCancelled: '已取消',
    billingError: '发生错误',
    alreadyPro: 'Pro计划使用中',
    manageSubscription: '管理订阅',
    buyTicket: '追加购买',
    buyTicketProOnly: '追加购买（仅Pro）',
    proRequiredHint: '仅限Pro计划购买，请升级。',
    purchasing: '购买中...',
    ticketSuccess: '购买成功！',
    ticketCancelled: '购买已取消',
    ticketSelectTitle: '选择加购套餐',
    ticketCheckoutError: '无法开始结算',
    proRequired: '仅Pro可购买',
    billingStatusFree: '免费版',
    billingStatusPro: 'Pro版',
    billingStatusCanceling: '取消中（{date}前有效）',
    billingStatusPastDue: '⚠️ 付款逾期，请更新付款方式。',
    billingStatusActive: '有效（下次续费: {date}）',
    companyInfo: '公司信息',
    companyNote: '※ Stripe的账单信息/取消请前往"管理订阅"',
    companyName: '公司名称',
    department: '部门',
    position: '职位',
    companyAddress: '地址',
    postalCode: '邮政编码',
    country: '国家',
    taxIdLabel: '税号类型',
    taxIdValue: '税号',
    saveCompany: '保存',
    editCompany: '编辑公司信息',
    companySaved: '已保存',
    companySavedWithStripe: '已保存（Stripe已同步）',
    companySavedStripeSkipped: '已保存（Stripe未同步）',
    companySaveError: '保存失败',
    errorPromptInjection: '检测到无效的输入模式，请检查您的输入。',
    errorNoTextToSummarize: '没有可摘要的文本',
    errorInputTooLong: '输入过长（超过上限）',
    errorSummaryFailed: '摘要生成失败',
    // 拼音: Liánjiē yǐ duànkāi. Wénběn yǐ bǎocún. Qǐng huīfù wǎngluò hòu chóngxīn diǎnjī kāishǐ.
    // 日本語訳: 接続が切れました。テキストは保存されています。ネットワーク復帰後に再度開始してください。
    networkDisconnected: '连接已断开。文本已保存。请恢复网络后重新点击开始。',
    // 拼音: Qǐngqiú shòuxiàn. Qǐng shāoděng hòu chóngshì.
    errorRateLimit: '请求受限。请稍等后重试。',
    // 拼音: Fúwùqì cuòwù. Qǐng shāohòu chóngshì.
    errorServerError: '服务器错误。请稍后重试。',
  },
};

// Get current UI language
const getUiLang = () => localStorage.getItem('uiLang') || 'ja';

// Translation function
const t = (key) => {
  const lang = getUiLang();
  return STRINGS[lang]?.[key] || STRINGS['ja'][key] || key;
};

// Apply i18n to all elements with data-i18n attribute
const applyI18n = () => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && STRINGS[getUiLang()]?.[key]) {
      el.textContent = t(key);
    }
  });
};

const ensureTakeoverDialog = () => {
  let dialog = document.getElementById('takeoverModal');
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.id = 'takeoverModal';

  const wrapper = document.createElement('div');
  wrapper.className = 'modal';

  const title = document.createElement('h2');
  title.dataset.takeover = 'title';

  const message = document.createElement('p');
  message.dataset.takeover = 'message';

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.dataset.takeover = 'confirm';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.dataset.takeover = 'cancel';

  actions.append(confirmBtn, cancelBtn);
  wrapper.append(title, message, actions);
  dialog.append(wrapper);
  document.body.appendChild(dialog);
  return dialog;
};

const showTakeoverDialog = (activeSince = null) => {
  const dialog = ensureTakeoverDialog();
  const title = dialog.querySelector('[data-takeover="title"]');
  const message = dialog.querySelector('[data-takeover="message"]');
  const confirmBtn = dialog.querySelector('[data-takeover="confirm"]');
  const cancelBtn = dialog.querySelector('[data-takeover="cancel"]');

  if (title) title.textContent = t('takeoverTitle');
  let messageText = t('takeoverMessage');
  if (activeSince) {
    try {
      const sinceDate = new Date(activeSince);
      const timeStr = sinceDate.toLocaleTimeString(getUiLang() === 'ja' ? 'ja-JP' : getUiLang() === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      messageText += `\n（開始時刻: ${timeStr}）`;
    } catch (_) { /* ignore parse errors */ }
  }
  if (message) message.textContent = messageText;
  // B案: confirmBtn（この端末で開始）は非表示にする
  if (confirmBtn) confirmBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.textContent = t('takeoverKeep');

  return new Promise((resolve) => {
    const onClose = (event) => {
      if (event) event.preventDefault();
      dialog.close();
      resolve(false);
    };

    cancelBtn?.addEventListener('click', onClose, { once: true });
    dialog.addEventListener('cancel', onClose, { once: true });

    if (!dialog.open) {
      dialog.showModal();
    }
  });
};

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const firebaseState = { initialized: false, error: null };
let auth = null;
let currentUser = null;
let els = {};

const createDefaultQuotaState = () => ({
  plan: null,
  baseRemainingThisMonth: null,
  totalAvailableThisMonth: null,
  baseDailyQuotaSeconds: null,
  dailyRemainingSeconds: null,
  creditSeconds: null,
  maxSessionSeconds: null,
  nextResetAt: null,
  blockedReason: null,
  // 新規フィールド
  dayJobLimit: null,
  dayJobUsed: 0,
  dayJobRemaining: null,
  retentionDays: 7,
  concurrentLimit: 1,
  concurrentActive: 0,
  billingEnabled: true,
  purchaseAvailable: true,
  loaded: false,
});

const API_BASE_URL = window.location.origin;
const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';
const LANGUAGE_SETTINGS = {
  input: 'Auto (mic)',
  output: 'Japanese',
};

// Debug mode: ?debug=1 in URL
const isDebugMode = () => new URLSearchParams(window.location.search).get('debug') === '1';

const isMissingConfigValue = (value) => !value || String(value).startsWith('PASTE_');

// Diagnostic log buffer (no secrets)
const diagLogs = [];
const MAX_DIAG_LOGS = 200;
const rawRealtimeEvents = [];
const MAX_RAW_REALTIME_EVENTS = 50;
const SECRET_PATTERNS = [
  /apiKey[^\s]*/gi,
  /AIza[0-9a-zA-Z_\-]{10,}/g,
  /Bearer\s+[0-9a-zA-Z._\-]+/gi,
  /idToken\s*[:=]\s*[0-9a-zA-Z._\-]+/gi,
];
const DEBUG_TEXT_BLOCKLIST = ['kaki']; // Remove legacy debug placeholders
const DEBUG_PREFIX_BLOCKLIST = ['Firebase initialized', 'Firebase initialised'];

const sanitizeDiagMessage = (msg = '') => {
  let text = typeof msg === 'string' ? msg : JSON.stringify(msg);
  SECRET_PATTERNS.forEach((pattern) => {
    text = text.replace(pattern, '[REDACTED]');
  });
  return text;
};

const refreshDevLogs = () => {
  if (!isDebugMode() || !els.devLogArea) return;
  // 直近50件を時系列順（古い→新しい）で表示
  const preview = diagLogs.slice(-50).join('\n');
  els.devLogArea.textContent = preview || 'ログはまだありません。';
};

const addDiagLog = (msg) => {
  const safeMsg = sanitizeDiagMessage(msg);
  const entry = `[${new Date().toISOString()}] ${safeMsg}`;
  diagLogs.push(entry); // 末尾に追加（古い順に並ぶ）
  if (diagLogs.length > MAX_DIAG_LOGS) diagLogs.shift(); // 先頭（最古）を削除
  refreshDevLogs();
};

const logErrorDetails = (label, err) => {
  const name = err?.name || 'Error';
  const message = err?.message || String(err);
  const stack = err?.stack || 'no_stack';
  const context = err?._context || label;
  const sessionId = state.sessionId || 'no_session';
  const buildVer = state.buildVersion || 'unknown';
  addDiagLog(`${label} error | ctx=${context} sid=${sessionId} build=${buildVer} name=${name} message=${message}`);
  addDiagLog(`${label} error stack | ${stack}`);
  console.error(`[${label}] ctx=${context} sid=${sessionId} build=${buildVer}`, err);
};

const addRawRealtimeEvent = (raw) => {
  rawRealtimeEvents.push(raw);
  if (rawRealtimeEvents.length > MAX_RAW_REALTIME_EVENTS) {
    rawRealtimeEvents.shift();
  }
};

const appendRawRealtimeToDiag = (text) => {
  const header = '\n\nRAW REALTIME EVENTS (latest 50):\n';
  if (!rawRealtimeEvents.length) return `${text}${header}(none)`;
  return `${text}${header}${rawRealtimeEvents.join('\n')}`;
};

const DIAG_COPY_LIMIT = 50; // コピー時は直近50行のみ
const getDiagLogDump = (limit = DIAG_COPY_LIMIT) => {
  // 直近limit件を時系列順（古い→新しい）で返す
  return diagLogs.slice(-limit).join('\n');
};

addDiagLog('App bootstrap start');

const updateFirebaseStatus = () => {
  // Only log to console, never show apiKey on screen
  const projectId = runtimeFirebaseConfig.projectId || 'missing';
  const statusLabel = firebaseState.initialized ? 'initialized' : 'not initialized';
  addDiagLog(`Firebase ${statusLabel} | projectId: ${projectId}`);
  updateDevStatusSummary();
};

const initFirebase = () => {
  try {
    if (!window.firebase || !window.firebase.initializeApp) {
      throw new Error('Firebase SDK not loaded');
    }
    const missingKeys = requiredConfigKeys.filter((key) =>
      isMissingConfigValue(runtimeFirebaseConfig[key])
    );
    if (missingKeys.length) {
      throw new Error(`Firebase config missing: ${missingKeys.join(', ')}`);
    }
    if (firebase.apps?.length) {
      firebase.app();
    } else {
      firebase.initializeApp(runtimeFirebaseConfig);
    }
    auth = firebase.auth();
    firebaseState.initialized = true;
    firebaseState.error = null;

    // Debug mode: expose auth helpers when ?debug=1
    if (isDebugMode()) {
      window.firebaseAuth = auth;
      window.__getIdToken = async (forceRefresh = true) => {
        const u = auth.currentUser;
        if (!u) {
          console.log('NO_CURRENT_USER');
          return null;
        }
        try {
          return await u.getIdToken(!!forceRefresh);
        } catch (e) {
          console.error('GET_ID_TOKEN_FAILED', e);
          return null;
        }
      };
      window.__copyIdToken = async (forceRefresh = true) => {
        const t = await window.__getIdToken(forceRefresh);
        if (!t) return null;
        try {
          await navigator.clipboard.writeText(t);
          console.log('COPIED_ID_TOKEN_LEN:', t.length);
        } catch (e) {
          console.warn('CLIPBOARD_WRITE_FAILED; printing token for manual copy');
          console.log(t);
        }
        return t;
      };
      console.log('DEBUG_TOKEN_HELPERS_READY');
    }
  } catch (err) {
    firebaseState.initialized = false;
    firebaseState.error = err;
  }
  updateFirebaseStatus();
  if (firebaseState.error) {
    console.error('Firebase init failed', firebaseState.error);
    setError('Firebase初期化に失敗しました。設定を確認してください。');
    addDiagLog(`Firebase init error: ${firebaseState.error.message}`);
  }
};

// Get Firebase ID token for API calls
const getAuthToken = async (forceRefresh = false) => {
  if (!firebaseState.initialized) {
    throw firebaseState.error || new Error('Firebase未初期化');
  }
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(forceRefresh);
  } catch (err) {
    console.error('Failed to get ID token:', err);
    return null;
  }
};

// Check if 401 response indicates token expiration (Firebase or OpenAI)
const isTokenExpiredError = (body) => {
  if (!body) return false;
  // FastAPI detail string: "invalid_auth", "token_expired", "id-token-expired"
  const detail = typeof body.detail === 'string' ? body.detail : '';
  if (/invalid_auth|token[_-]?expired|id[_-]?token[_-]?expired/i.test(detail)) {
    return true;
  }
  // body.code or body.error.code patterns
  const code = body.code || body.error?.code || '';
  if (/token[_-]?expired|id[_-]?token[_-]?expired|invalid[_-]?auth/i.test(code)) {
    return true;
  }
  // body.message or body.error.message patterns
  const message = body.message || body.error?.message || '';
  if (/token.*expired|expired.*token|session.*expired/i.test(message)) {
    return true;
  }
  return false;
};

// Authenticated fetch wrapper with 401 retry (forceRefresh once)
const authFetch = async (url, options = {}, _retried = false) => {
  const token = await getAuthToken(_retried); // forceRefresh on retry
  if (!token) {
    throw new Error(t('errorLoginRequired'));
  }
  const headers = options.headers instanceof Headers
    ? new Headers(options.headers)
    : new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  // Handle 401: check if token expired and retry once with forceRefresh
  if (res.status === 401 && !_retried) {
    let body = null;
    try {
      body = await res.clone().json();
    } catch {
      // ignore parse error
    }
    if (isTokenExpiredError(body)) {
      addDiagLog(`[auth] 401 detected, retrying with forceRefresh | url=${url}`);
      return authFetch(url, options, true);
    }
  }

  // If still 401 after retry, sign out and show session expired message
  if (res.status === 401 && _retried) {
    addDiagLog(`[auth] 401 after retry, signing out | url=${url}`);
    setError(t('errorLoginRequired'));
    if (auth) {
      try {
        await auth.signOut();
      } catch {
        // ignore signOut error
      }
    }
  }

  return res;
};

const cacheElements = () => {
  els = {
    status: document.getElementById('status'),
    quotaInfo: document.getElementById('quotaInfo'),
    quotaBreakdown: document.getElementById('quotaBreakdown'),
    liveTranscript: document.getElementById('liveTranscript'),
    transcriptLog: document.getElementById('transcriptLog'),
    translationLog: document.getElementById('translationLog'),
    start: document.getElementById('startBtn'),
    stop: document.getElementById('stopBtn'),
    error: document.getElementById('error'),
    downloads: document.getElementById('downloads'),
    a2hs: document.getElementById('a2hs'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    maxChars: document.getElementById('maxChars'),
    gapMs: document.getElementById('gapMs'),
    vadSilence: document.getElementById('vadSilence'),
    saveSettings: document.getElementById('saveSettings'),
    presetFast: document.getElementById('presetFast'),
    presetBalanced: document.getElementById('presetBalanced'),
    presetStable: document.getElementById('presetStable'),
    uiLang: document.getElementById('uiLang'),
    inputLang: document.getElementById('inputLang'),
    outputLang: document.getElementById('outputLang'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userEmail: document.getElementById('userEmail'),
    // Dev Panel elements
    devPanelBtn: document.getElementById('devPanelBtn'),
    devPanelModal: document.getElementById('devPanelModal'),
    devStatus: document.getElementById('devStatus'),
    devLogArea: document.getElementById('devLogArea'),
    devCopyLogs: document.getElementById('devCopyLogs'),
    devTestEvent: document.getElementById('devTestEvent'),
    devClearCache: document.getElementById('devClearCache'),
    devCopyIdToken: document.getElementById('devCopyIdToken'),
    devCloseBtn: document.getElementById('devCloseBtn'),
    devCacheHelp: document.getElementById('devCacheHelp'),
    devNotice: document.getElementById('devNotice'),
    // Glossary & Summary Settings
    glossaryTextInput: document.getElementById('glossaryTextInput'),
    summaryPromptInput: document.getElementById('summaryPromptInput'),
    resetUserSettings: document.getElementById('resetUserSettings'),
    // STT Settings (Realtime API)
    sttInputLang: document.getElementById('sttInputLang'),
    sttVadPreset: document.getElementById('sttVadPreset'),
    sttVadCustom: document.getElementById('sttVadCustom'),
    sttVadThreshold: document.getElementById('sttVadThreshold'),
    sttVadSilence: document.getElementById('sttVadSilence'),
    sttVadPrefix: document.getElementById('sttVadPrefix'),
    sttNoiseReduction: document.getElementById('sttNoiseReduction'),
    sttTranscriptionModel: document.getElementById('sttTranscriptionModel'),
    sttDebugPayload: document.getElementById('sttDebugPayload'),
    sttDebugPayloadContent: document.getElementById('sttDebugPayloadContent'),
    // Dictionary CSV Upload
    dictionaryCsvInput: document.getElementById('dictionaryCsvInput'),
    uploadDictionaryCsv: document.getElementById('uploadDictionaryCsv'),
    dictionaryUploadResult: document.getElementById('dictionaryUploadResult'),
    // Summary Section (after Stop)
    summarySection: document.getElementById('summarySection'),
    runSummary: document.getElementById('runSummary'),
    copySummary: document.getElementById('copySummary'),
    summaryOutput: document.getElementById('summaryOutput'),
    // Billing Section
    billingSection: document.getElementById('billingSection'),
    upgradeProBtn: document.getElementById('upgradeProBtn'),
    manageBillingBtn: document.getElementById('manageBillingBtn'),
    buyTicketBtn: document.getElementById('buyTicketBtn'),
    billingStatus: document.getElementById('billingStatus'),
    // Ticket Modal
    ticketModal: document.getElementById('ticketModal'),
    ticketModalClose: document.getElementById('ticketModalClose'),
    ticketModalStatus: document.getElementById('ticketModalStatus'),
    // Company Section (in settings)
    companySection: document.getElementById('companySection'),
    editCompanyBtn: document.getElementById('editCompanyBtn'),
    // Company Edit Modal
    companyEditModal: document.getElementById('companyEditModal'),
    companyEditClose: document.getElementById('companyEditClose'),
    companyName: document.getElementById('companyName'),
    companyDepartment: document.getElementById('companyDepartment'),
    companyPosition: document.getElementById('companyPosition'),
    companyAddress: document.getElementById('companyAddress'),
    companyPostalCode: document.getElementById('companyPostalCode'),
    companyCountry: document.getElementById('companyCountry'),
    companyTaxIdLabel: document.getElementById('companyTaxIdLabel'),
    companyTaxIdValue: document.getElementById('companyTaxIdValue'),
    saveCompanyBtn: document.getElementById('saveCompanyBtn'),
    companyStatus: document.getElementById('companyStatus'),
    // Dictionary UI
    dictionaryCountDisplay: document.getElementById('dictionaryCountDisplay'),
    dictionaryView: document.getElementById('dictionaryView'),
    dictionaryBackBtn: document.getElementById('dictionaryBackBtn'),
    openDictionaryBtn: document.getElementById('openDictionaryBtn'),
    appShell: document.querySelector('.app-shell'),
    downloadDictionaryTemplate: document.getElementById('downloadDictionaryTemplate'),
    dictAddSource: document.getElementById('dictAddSource'),
    dictAddTarget: document.getElementById('dictAddTarget'),
    dictAddNote: document.getElementById('dictAddNote'),
    dictAddBtn: document.getElementById('dictAddBtn'),
    dictAddResult: document.getElementById('dictAddResult'),
    dictListLoading: document.getElementById('dictListLoading'),
    dictListEmpty: document.getElementById('dictListEmpty'),
    dictTable: document.getElementById('dictTable'),
    dictTableBody: document.getElementById('dictTableBody'),
    dictLoadMore: document.getElementById('dictLoadMore'),
    dictListCount: document.getElementById('dictListCount'),
    // SW Update UI
    swUpdateBanner: document.getElementById('swUpdateBanner'),
    swUpdateBtn: document.getElementById('swUpdateBtn'),
    buildShaDisplay: document.getElementById('buildShaDisplay'),
    // Result Card (after Stop)
    resultCard: document.getElementById('resultCard'),
    resultCardTitle: document.getElementById('resultCardTitle'),
    resultCardTimestamp: document.getElementById('resultCardTimestamp'),
    resultCardFiles: document.getElementById('resultCardFiles'),
    resultCardSummary: document.getElementById('resultCardSummary'),
    runSummaryCard: document.getElementById('runSummaryCard'),
    copySummaryCard: document.getElementById('copySummaryCard'),
    summaryOutputCard: document.getElementById('summaryOutputCard'),
    // History UI
    openHistoryBtn: document.getElementById('openHistoryBtn'),
    historyView: document.getElementById('historyView'),
    historyBackBtn: document.getElementById('historyBackBtn'),
    historyList: document.getElementById('historyList'),
    historyListLoading: document.getElementById('historyListLoading'),
    historyListEmpty: document.getElementById('historyListEmpty'),
    // History Detail UI
    historyDetailView: document.getElementById('historyDetailView'),
    historyDetailBackBtn: document.getElementById('historyDetailBackBtn'),
    historyDetailTitle: document.getElementById('historyDetailTitle'),
    historyDetailContent: document.getElementById('historyDetailContent'),
  };
  if (els.historyListEmpty && !state.historyEmptyDefault) {
    state.historyEmptyDefault = els.historyListEmpty.textContent || '';
  }
};

const state = {
  pc: null,
  dataChannel: null,
  mediaStream: null,
  recorder: null,
  recordingChunks: [],
  gapTimer: null,
  liveOriginal: '',
  liveTranslation: '',
  logs: [],
  translations: [],
  partialByItem: new Map(),
  committedItems: new Set(),
  activeItemId: null,
  maxChars: Number(localStorage.getItem('maxChars')) || 300,
  gapMs: Number(localStorage.getItem('gapMs')) || 1000,
  vadSilence: Number(localStorage.getItem('vadSilence')) || 400,
  uiLang: localStorage.getItem('uiLang') || 'ja',
  inputLang: localStorage.getItem('inputLang') || 'auto',
  outputLang: localStorage.getItem('outputLang') || 'ja',
  token: null,
  hasShownA2HS: localStorage.getItem('a2hsShown') === '1',
  quota: createDefaultQuotaState(),
  currentJob: null,
  jobStartedAt: null,
  jobActive: false, // ジョブが有効（予約済み〜完了前）かどうか
  startInFlight: false, // Start処理がin-flight中かどうか（二重発火防止）
  uiBound: false, // UIイベントハンドラが登録済みか（二重登録防止）
  historyListBound: false, // 履歴一覧クリックハンドラの二重登録防止
  historyEmptyDefault: '',
  serverTimeOffsetMs: null, // サーバ時刻との差分（ms）
  // スロットル/クールダウン管理
  lastJobCreateAt: 0, // 最後にjobs/createを呼んだ時刻（Date.now()）
  cooldownUntil: 0, // クールダウン終了時刻（Date.now()）
  cooldownTimerId: null, // カウントダウン表示用タイマーID
  // Glossary & Summary Settings
  glossaryText: localStorage.getItem('rt_glossary_text') || '',
  summaryPrompt: localStorage.getItem('rt_summary_prompt') || '',
  // Realtime event queue (for session.update before dataChannel is open)
  realtimeEventQueue: [],
  // STT Settings (Realtime API session.update)
  sttSettings: {
    // Selected values (persisted to localStorage)
    inputLang: localStorage.getItem('stt_input_lang') || 'auto', // auto/zh/ja/en
    vadPreset: localStorage.getItem('stt_vad_preset') || 'stable', // stable/fast/custom
    vadThreshold: Number(localStorage.getItem('stt_vad_threshold')) || 0.65,
    vadSilence: Number(localStorage.getItem('stt_vad_silence')) || 800,
    vadPrefix: Number(localStorage.getItem('stt_vad_prefix')) || 500,
    noiseReduction: localStorage.getItem('stt_noise_reduction') || 'auto', // auto=don't send, near_field/far_field/off
    transcriptionModel: localStorage.getItem('stt_transcription_model') || 'auto', // auto=gpt-4o-mini-transcribe (default), gpt-4o-transcribe
    // Dirty flags (true = user changed this setting, should be sent to API)
    dirty: {
      inputLang: false,
      vadPreset: false,
      noiseReduction: false,
      transcriptionModel: false,
    },
    // Guard: only apply once per WS open
    wsAppliedOnce: false,
  },
  // Diagnostics: session tracking
  sessionId: null, // Generated per connection attempt
  buildVersion: null, // Fetched from /build.txt
  // History (Sprint 2): current session data for result card
  currentSessionResult: null, // { id, timestamp, title, originals, translations, summary, audioUrl, m4aUrl }
  // Temporary Blob URLs for cleanup (memory management)
  objectUrls: [],
};

// ========== Glossary Storage Adapter ==========
const GLOSSARY_STORAGE_KEY = 'rt_glossary_text';
const SUMMARY_PROMPT_STORAGE_KEY = 'rt_summary_prompt';
const GLOSSARY_MAX_LINES = 200;
const SUMMARY_PROMPT_MAX_LENGTH = 2000;

const glossaryStorage = {
  get: () => localStorage.getItem(GLOSSARY_STORAGE_KEY) || '',
  set: (text) => {
    localStorage.setItem(GLOSSARY_STORAGE_KEY, text);
    state.glossaryText = text;
  },
  clear: () => {
    localStorage.removeItem(GLOSSARY_STORAGE_KEY);
    state.glossaryText = '';
  },
};

const summaryPromptStorage = {
  get: () => localStorage.getItem(SUMMARY_PROMPT_STORAGE_KEY) || '',
  set: (text) => {
    // Enforce max length
    const trimmed = (text || '').trim().slice(0, SUMMARY_PROMPT_MAX_LENGTH);
    localStorage.setItem(SUMMARY_PROMPT_STORAGE_KEY, trimmed);
    state.summaryPrompt = trimmed;
  },
  clear: () => {
    localStorage.removeItem(SUMMARY_PROMPT_STORAGE_KEY);
    state.summaryPrompt = '';
  },
};

// ========== Prompt Injection Protection (Sprint 3) ==========
const PROMPT_INJECTION_CONFIG = {
  maxPromptLength: 2000,
  maxGlossaryLength: 10000,
  maxTextLength: 100000,
  // Dangerous patterns that could attempt role/instruction hijacking
  dangerousPatterns: [
    // Role injection attempts
    /^system\s*:/im,
    /^developer\s*:/im,
    /^tool\s*:/im,
    /^assistant\s*:/im,
    /\[\s*system\s*\]/im,
    /\[\s*developer\s*\]/im,
    // Instruction override attempts
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/im,
    /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/im,
    /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/im,
    /override\s+(system|instructions?|prompts?)/im,
    /new\s+instructions?\s*:/im,
    /you\s+are\s+now\s+/im,
    /act\s+as\s+(if\s+you\s+are\s+)?a?\s*(different|new|another)/im,
    // Jailbreak patterns
    /\bDAN\b.*mode/im,
    /jailbreak/im,
    /bypass\s+(safety|filter|restriction)/im,
    // Markdown/format injection for prompt leaking
    /```\s*(system|prompt|instruction)/im,
  ],
};

// Audit log for security events (summary only, no full input)
const logSecurityEvent = (eventType, details) => {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType,
    ...details,
  };
  // Log to console in debug mode, add to diag log
  if (isDebugMode()) {
    console.warn('[Security]', entry);
  }
  addDiagLog(`[Security] ${eventType}: ${JSON.stringify(details)}`);
};

// Validate and sanitize user prompt input
const validatePromptInput = (input, fieldName, maxLength) => {
  if (!input || typeof input !== 'string') {
    return { valid: true, sanitized: '', warnings: [] };
  }

  const warnings = [];
  let sanitized = input.trim();

  // Length check
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
    warnings.push({ rule: 'LENGTH_EXCEEDED', field: fieldName, maxLength });
  }

  // Check for dangerous patterns
  for (let i = 0; i < PROMPT_INJECTION_CONFIG.dangerousPatterns.length; i++) {
    const pattern = PROMPT_INJECTION_CONFIG.dangerousPatterns[i];
    if (pattern.test(sanitized)) {
      logSecurityEvent('INJECTION_DETECTED', {
        field: fieldName,
        ruleIndex: i,
        inputLength: input.length,
      });
      return {
        valid: false,
        sanitized: '',
        warnings: [{ rule: 'INJECTION_PATTERN', field: fieldName, ruleIndex: i }],
        errorMessage: t('errorPromptInjection') || '不正な入力パターンが検出されました。入力を確認してください。',
      };
    }
  }

  return { valid: true, sanitized, warnings };
};

// Validate all inputs before sending to /summarize
const validateSummarizeInputs = (text, glossaryText, summaryPrompt) => {
  const results = {
    valid: true,
    text: '',
    glossaryText: '',
    summaryPrompt: '',
    errors: [],
    warnings: [],
  };

  // Validate main text
  const textResult = validatePromptInput(text, 'text', PROMPT_INJECTION_CONFIG.maxTextLength);
  if (!textResult.valid) {
    results.valid = false;
    results.errors.push(textResult.errorMessage);
  } else {
    results.text = textResult.sanitized;
    results.warnings.push(...textResult.warnings);
  }

  // Validate glossary
  const glossaryResult = validatePromptInput(glossaryText, 'glossary', PROMPT_INJECTION_CONFIG.maxGlossaryLength);
  if (!glossaryResult.valid) {
    results.valid = false;
    results.errors.push(glossaryResult.errorMessage);
  } else {
    results.glossaryText = glossaryResult.sanitized;
    results.warnings.push(...glossaryResult.warnings);
  }

  // Validate custom prompt
  const promptResult = validatePromptInput(summaryPrompt, 'summaryPrompt', PROMPT_INJECTION_CONFIG.maxPromptLength);
  if (!promptResult.valid) {
    results.valid = false;
    results.errors.push(promptResult.errorMessage);
  } else {
    results.summaryPrompt = promptResult.sanitized;
    results.warnings.push(...promptResult.warnings);
  }

  // Log warnings if any
  if (results.warnings.length > 0) {
    logSecurityEvent('INPUT_WARNINGS', { warnings: results.warnings });
  }

  return results;
};

// ========== LLM Title Generation (Sprint 3) ==========
const generateSessionTitleLLM = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return null;
  }

  // Take first 500 chars for title generation (sufficient context)
  const inputText = text.trim().slice(0, 500);

  try {
    const fd = new FormData();
    fd.append('text', inputText);
    fd.append('output_lang', state.outputLang || 'ja');

    const res = await authFetch('/generate_title', { method: 'POST', body: fd });
    if (!res.ok) {
      addDiagLog(`LLM title generation failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    const title = (data.title || '').trim();

    if (title && title.length > 0 && title.length <= TITLE_MAX_LENGTH) {
      addDiagLog(`LLM title generated: "${title}"`);
      return title.replace(TITLE_FORBIDDEN_CHARS, '');
    }
    return null;
  } catch (err) {
    addDiagLog(`LLM title generation error: ${err.message}`);
    return null;
  }
};

// Generate title with LLM fallback to simple extraction
const generateSessionTitleWithFallback = async (text) => {
  // Try LLM first
  const llmTitle = await generateSessionTitleLLM(text);
  if (llmTitle) {
    return llmTitle;
  }
  // Fallback to simple extraction
  return generateSessionTitle(text);
};

// ========== History Storage (IndexedDB) ==========
const HISTORY_DB_NAME = 'rt_history_db';
const HISTORY_STORE_NAME = 'sessions';
const HISTORY_DB_VERSION = 1;

let historyDb = null;

const openHistoryDb = () => {
  return new Promise((resolve, reject) => {
    if (historyDb) {
      resolve(historyDb);
      return;
    }
    const request = indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      historyDb = request.result;
      resolve(historyDb);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        const store = db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const historyStorage = {
  async save(session) {
    const db = await openHistoryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(HISTORY_STORE_NAME);
      const request = store.put(session);
      request.onsuccess = () => resolve(session.id);
      request.onerror = () => reject(request.error);
    });
  },
  async getAll() {
    const db = await openHistoryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
      const store = tx.objectStore(HISTORY_STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // newest first
      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },
  async get(id) {
    const db = await openHistoryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
      const store = tx.objectStore(HISTORY_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },
  async delete(id) {
    const db = await openHistoryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(HISTORY_STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

// ========== Title Generation (MVP) ==========
const TITLE_MAX_LENGTH = 40;
const TITLE_FORBIDDEN_CHARS = /[\/\\:*?"<>|]/g;

const generateSessionTitle = (text) => {
  if (!text || typeof text !== 'string') return '';
  // Take first line or first N characters
  const firstLine = text.split('\n')[0] || '';
  let title = firstLine.trim().slice(0, TITLE_MAX_LENGTH);
  // Remove forbidden characters
  title = title.replace(TITLE_FORBIDDEN_CHARS, '');
  // Trim trailing whitespace
  title = title.trim();
  return title || '';
};

const formatTimestamp = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// OS-safe timestamp for filenames (no ":" or spaces - Windows compatible)
const formatTimestampForFilename = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
};

// ========== Glossary Parsing ==========
// Parse glossary text into normalized entries: { source, target }[]
const parseGlossary = (text) => {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split('\n');
  const entries = [];
  let skippedCount = 0;

  for (let i = 0; i < lines.length && entries.length < GLOSSARY_MAX_LINES; i++) {
    const line = lines[i].trim();
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Match "source=target" or "source=>target"
    const match = line.match(/^(.+?)\s*=>\s*(.+)$/) || line.match(/^(.+?)\s*=\s*(.+)$/);
    if (match) {
      const source = match[1].trim();
      const target = match[2].trim();
      if (source && target) {
        entries.push({ source, target });
      } else {
        skippedCount++;
        addDiagLog(`glossary invalid line skipped: "${line.substring(0, 50)}"`);
      }
    } else {
      skippedCount++;
      addDiagLog(`glossary invalid line skipped: "${line.substring(0, 50)}"`);
    }
  }

  if (lines.length > GLOSSARY_MAX_LINES) {
    addDiagLog(`glossary truncated: ${lines.length} lines -> ${GLOSSARY_MAX_LINES} max`);
  }

  return entries;
};

// ========== Session Instructions Builder ==========
const BASE_INSTRUCTIONS = [
  'You are a real-time interpreter.',
  'Output only the translated text. No extra commentary.',
  'Preserve proper nouns, acronyms, and numbers.',
].join(' ');

const buildSessionInstructions = (glossaryEntries, outputLang) => {
  let instructions = BASE_INSTRUCTIONS;

  // Add output language hint
  if (outputLang && outputLang !== 'auto') {
    const langNames = { ja: 'Japanese', en: 'English', zh: 'Chinese' };
    const langName = langNames[outputLang] || outputLang;
    instructions += ` Translate into ${langName}.`;
  }

  // Add glossary section if entries exist
  if (glossaryEntries && glossaryEntries.length > 0) {
    instructions += '\n\nGlossary (must-follow):';
    glossaryEntries.forEach(({ source, target }) => {
      instructions += `\n- ${source} => ${target}`;
    });
    instructions += '\n\nGlossary rules:';
    instructions += '\n- If a glossary entry matches, you MUST use the specified target term.';
    instructions += '\n- Avoid partial-match mistakes; prefer whole-word matches when reasonable.';
    instructions += '\n- Do not invent glossary entries.';
  }

  return instructions;
};

// ========== Realtime Event Sender with Queue ==========
const sendRealtimeEvent = (payload) => {
  const dc = state.dataChannel;
  if (dc && dc.readyState === 'open') {
    try {
      dc.send(JSON.stringify(payload));
      addDiagLog(`Realtime event sent: ${payload.type}`);
      return true;
    } catch (err) {
      addDiagLog(`Realtime event send failed: ${err.message}`);
      return false;
    }
  } else {
    // Queue the event for later
    state.realtimeEventQueue.push(payload);
    addDiagLog(`Realtime event queued: ${payload.type} (dataChannel not open)`);
    return false;
  }
};

// Flush queued events when dataChannel opens
const flushRealtimeEventQueue = () => {
  const dc = state.dataChannel;
  if (!dc || dc.readyState !== 'open') return;

  while (state.realtimeEventQueue.length > 0) {
    const payload = state.realtimeEventQueue.shift();
    try {
      dc.send(JSON.stringify(payload));
      addDiagLog(`Realtime queued event sent: ${payload.type}`);
    } catch (err) {
      addDiagLog(`Realtime queued event send failed: ${err.message}`);
    }
  }
};

// Build STT settings payload based on dirty flags
// Only includes settings that user has explicitly changed
const buildSttPayload = () => {
  const stt = state.sttSettings;
  const dirty = stt.dirty;

  const transcription = {};
  const turn_detection = { type: 'server_vad', create_response: false };
  let hasTranscription = false;
  let hasTurnDetection = false;
  let noiseReduction = null;

  // Transcription model (only if dirty)
  if (dirty.transcriptionModel && stt.transcriptionModel !== 'auto') {
    transcription.model = stt.transcriptionModel;
    hasTranscription = true;
  } else if (dirty.transcriptionModel) {
    // auto = use default (gpt-4o-mini-transcribe)
    transcription.model = 'gpt-4o-mini-transcribe';
    hasTranscription = true;
  }

  // Input language (only if dirty and not auto)
  if (dirty.inputLang && stt.inputLang !== 'auto') {
    transcription.language = stt.inputLang;
    hasTranscription = true;
  }

  // VAD preset (only if dirty)
  if (dirty.vadPreset) {
    hasTurnDetection = true;
    if (stt.vadPreset === 'custom') {
      turn_detection.threshold = stt.vadThreshold;
      turn_detection.silence_duration_ms = stt.vadSilence;
      turn_detection.prefix_padding_ms = stt.vadPrefix;
    } else {
      const preset = STT_VAD_PRESETS[stt.vadPreset] || STT_VAD_PRESETS.stable;
      turn_detection.threshold = preset.threshold;
      turn_detection.silence_duration_ms = preset.silence_duration_ms;
      turn_detection.prefix_padding_ms = preset.prefix_padding_ms;
    }
  }

  // Noise reduction (only if dirty and not auto)
  if (dirty.noiseReduction && stt.noiseReduction !== 'auto') {
    noiseReduction = stt.noiseReduction;
  }

  // Build the payload
  const input = {};
  if (hasTranscription) {
    // If model not set, use default
    if (!transcription.model) {
      transcription.model = 'gpt-4o-mini-transcribe';
    }
    input.transcription = transcription;
  }
  if (hasTurnDetection) {
    input.turn_detection = turn_detection;
  }
  if (noiseReduction) {
    input.noise_reduction = { type: noiseReduction };
  }

  // Return null if no settings to send
  if (Object.keys(input).length === 0) {
    return null;
  }

  return {
    type: 'session.update',
    session: {
      type: 'realtime',
      audio: { input },
    },
  };
};

// Apply STT settings via session.update (called once after WS open if dirty settings exist)
const applyRealtimeSttSettings = () => {
  // Guard: only apply once per connection
  if (state.sttSettings.wsAppliedOnce) {
    addDiagLog('applyRealtimeSttSettings: already applied, skipping');
    return;
  }

  const payload = buildSttPayload();

  // Update debug display if in debug mode
  if (isDebugMode() && els.sttDebugPayload && els.sttDebugPayloadContent) {
    els.sttDebugPayload.style.display = 'block';
    els.sttDebugPayloadContent.textContent = payload
      ? JSON.stringify(payload, null, 2)
      : '(no dirty settings to send)';
  }

  if (!payload) {
    addDiagLog('applyRealtimeSttSettings: no dirty settings, skipping send');
    state.sttSettings.wsAppliedOnce = true;
    return;
  }

  try {
    console.log('[applyRealtimeSttSettings] payload:', JSON.stringify(payload, null, 2));
    addDiagLog(`applyRealtimeSttSettings: sending session.update | sid=${state.sessionId || 'no_sid'}`);
    const sent = sendRealtimeEvent(payload);
    addDiagLog(`applyRealtimeSttSettings: session.update sent=${sent} queued=${!sent}`);
    state.sttSettings.wsAppliedOnce = true;
  } catch (err) {
    logErrorDetails('applyRealtimeSttSettings', err);
    addDiagLog(`applyRealtimeSttSettings: error - ${err.message}`);
  }
};

// Legacy sendSessionUpdate - now uses sttSettings for VAD but keeps backward compatibility
// This is called from dataChannel.onopen for basic session setup
const sendSessionUpdate = () => {
  // Use sttSettings VAD values if dirty, otherwise use legacy state.vadSilence
  const stt = state.sttSettings;
  let vadConfig;

  if (stt.dirty.vadPreset) {
    // User changed VAD preset - use sttSettings
    if (stt.vadPreset === 'custom') {
      vadConfig = {
        threshold: stt.vadThreshold,
        silence_duration_ms: stt.vadSilence,
        prefix_padding_ms: stt.vadPrefix,
      };
    } else {
      const preset = STT_VAD_PRESETS[stt.vadPreset] || STT_VAD_PRESETS.stable;
      vadConfig = {
        threshold: preset.threshold,
        silence_duration_ms: preset.silence_duration_ms,
        prefix_padding_ms: preset.prefix_padding_ms,
      };
    }
  } else {
    // Use legacy settings (backward compatible - existing behavior)
    vadConfig = {
      threshold: 0.5,
      silence_duration_ms: Number(state.vadSilence) || 500,
      prefix_padding_ms: 300,
    };
  }

  // Language: use sttSettings if dirty, otherwise use legacy state.inputLang
  const transcriptionLanguage = stt.dirty.inputLang
    ? (stt.inputLang !== 'auto' ? stt.inputLang : undefined)
    : (state.inputLang && state.inputLang !== 'auto' ? state.inputLang : undefined);

  // Model: use sttSettings if dirty, otherwise use default
  const transcriptionModel = stt.dirty.transcriptionModel && stt.transcriptionModel !== 'auto'
    ? stt.transcriptionModel
    : 'gpt-4o-mini-transcribe';

  // Build payload
  const input = {
    transcription: {
      model: transcriptionModel,
      ...(transcriptionLanguage ? { language: transcriptionLanguage } : {}),
    },
    turn_detection: {
      type: 'server_vad',
      ...vadConfig,
      create_response: false,
    },
  };

  // Add noise reduction if dirty and not auto
  if (stt.dirty.noiseReduction && stt.noiseReduction !== 'auto') {
    input.noise_reduction = { type: stt.noiseReduction };
  }

  const payload = {
    type: 'session.update',
    session: {
      type: 'realtime',
      audio: { input },
    },
  };

  try {
    // 送信前ログ（デバッグ用・機密なし）
    console.log('[sendSessionUpdate] payload:', JSON.stringify(payload, null, 2));
    addDiagLog(`STEP_SESSION_UPDATE: session.type=${payload.session.type} sid=${state.sessionId || 'no_sid'}`);
    const sent = sendRealtimeEvent(payload);
    addDiagLog(`session.update sent | queued=${!sent} sid=${state.sessionId || 'no_sid'}`);

    // Mark STT settings as applied
    state.sttSettings.wsAppliedOnce = true;

    // Update debug display
    if (isDebugMode() && els.sttDebugPayload && els.sttDebugPayloadContent) {
      els.sttDebugPayload.style.display = 'block';
      els.sttDebugPayloadContent.textContent = JSON.stringify(payload, null, 2);
    }
  } catch (err) {
    logErrorDetails('sendSessionUpdate', err);
    throw err;
  }
};

const showDevNotice = (text = '') => {
  if (!isDebugMode() || !els.devNotice) return;
  els.devNotice.textContent = text;
};

const updateDevStatusSummary = () => {
  if (!isDebugMode() || !els.devStatus) return;
  const firebaseLabel = firebaseState.initialized
    ? '初期化済み'
    : firebaseState.error
      ? `エラー: ${firebaseState.error.message}`
      : '未初期化';
  const authLabel = currentUser ? 'ログイン済み' : '未ログイン';
  const lines = [
    `Firebase: ${firebaseLabel}`,
    `Auth: ${authLabel}`,
    `API: ${API_BASE_URL}`,
    `Project: ${runtimeFirebaseConfig.projectId || 'missing'}`,
    `Languages: input=${state.inputLang} → output=${state.outputLang} (UI: ${state.uiLang})`,
    `Settings: maxChars=${state.maxChars}, gapMs=${state.gapMs}, vadSilence=${state.vadSilence}`,
  ];
  if (state.quota.loaded) {
    const totalMinutes = formatMinutes(state.quota.totalAvailableThisMonth);
    const dailyInfo =
      state.quota.plan === 'free' && typeof state.quota.dailyRemainingSeconds === 'number'
        ? ` / daily ${formatMinutes(state.quota.dailyRemainingSeconds)}m`
        : '';
    lines.push(`Quota: ${totalMinutes}m${dailyInfo}`);
  }
  els.devStatus.textContent = lines.join('\n');
};

const scrubDebugArtifacts = () => {
  const legacyStatus = document.getElementById('firebaseStatus');
  if (legacyStatus) {
    legacyStatus.remove();
  }
  if (!document.body || !window.NodeFilter) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const toClear = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const trimmed = node.textContent.trim();
    if (!trimmed) continue;
    if (
      DEBUG_TEXT_BLOCKLIST.includes(trimmed) ||
      DEBUG_PREFIX_BLOCKLIST.some((prefix) => trimmed.startsWith(prefix))
    ) {
      toClear.push(node);
    }
  }
  toClear.forEach((node) => {
    node.textContent = '';
  });
};

const toggleCacheHelp = () => {
  if (!isDebugMode() || !els.devCacheHelp) return;
  const isHidden = els.devCacheHelp.hasAttribute('hidden');
  if (isHidden) {
    els.devCacheHelp.removeAttribute('hidden');
    showDevNotice('キャッシュクリア手順を表示しました');
  } else {
    els.devCacheHelp.setAttribute('hidden', '');
    showDevNotice('キャッシュクリア手順を隠しました');
  }
};

const copyDiagnosticsToClipboard = async () => {
  if (!isDebugMode()) return;
  let text = getDiagLogDump(DIAG_COPY_LIMIT);
  if (text) {
    text = appendRawRealtimeToDiag(text);
  }
  if (!text) {
    showDevNotice('診断ログはまだありません');
    return;
  }
  const lineCount = text.split('\n').length;
  try {
    await navigator.clipboard.writeText(text);
    showDevNotice(`診断ログ（直近${lineCount}行）をコピーしました`);
  } catch (err) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      showDevNotice(`診断ログ（直近${lineCount}行）をコピーしました`);
    } catch (fallbackErr) {
      console.error('Copy failed', fallbackErr);
      showDevNotice('コピーに失敗しました');
    }
  }
};

const runUiTestLines = () => {
  if (!isDebugMode()) return;
  const timestamp = new Date().toLocaleTimeString();
  const liveText = `[UI TEST ${timestamp}] layout check`;
  state.liveOriginal = liveText;
  updateLiveText();
  addTranscriptLog(`[UI TEST ${timestamp}] 原文サンプル`);
  addTranslationLog(`[UI TEST ${timestamp}] 翻訳サンプル`);
  addDiagLog('UIテスト行を追加しました');
  showDevNotice('UIテスト用の行を追加しました');
};

const setupDevPanel = () => {
  if (!els.devPanelBtn) return;
  if (!isDebugMode()) {
    els.devPanelBtn.remove();
    return;
  }
  els.devPanelBtn.style.display = '';
  els.devPanelBtn.addEventListener('click', () => {
    if (!els.devPanelModal) return;
    if (!els.devPanelModal.open) {
      els.devPanelModal.showModal();
    }
    refreshDevLogs();
    updateDevStatusSummary();
  });
  els.devCloseBtn?.addEventListener('click', () => {
    els.devPanelModal?.close();
    showDevNotice('');
  });
  els.devCopyLogs?.addEventListener('click', (e) => {
    e.preventDefault();
    copyDiagnosticsToClipboard();
  });
  els.devTestEvent?.addEventListener('click', (e) => {
    e.preventDefault();
    runUiTestLines();
  });
  els.devClearCache?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCacheHelp();
  });
  els.devCopyIdToken?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showDevNotice('ログインしていません');
      return;
    }
    try {
      const token = await currentUser.getIdToken(true);
      await navigator.clipboard.writeText(token);
      showDevNotice('IDトークンをコピーしました (curlテスト用)');
      addDiagLog('ID_TOKEN copied to clipboard');
    } catch (err) {
      showDevNotice(`IDトークン取得エラー: ${err.message}`);
      addDiagLog(`ID_TOKEN copy failed: ${err.message}`);
    }
  });
  if (els.devPanelModal) {
    els.devPanelModal.addEventListener('close', () => showDevNotice(''));
  }
  addDiagLog('Developer panelが有効になりました');
  updateDevStatusSummary();
};

const setStatus = (text) => {
  if (els.status) {
    els.status.textContent = text;
  }
};

const PRESETS = {
  fast: { maxChars: 240, gapMs: 700, vadSilence: 300 },
  balanced: { maxChars: 300, gapMs: 1000, vadSilence: 400 },
  stable: { maxChars: 360, gapMs: 1500, vadSilence: 550 },
};

// STT VAD Presets for OpenAI Realtime API turn_detection
const STT_VAD_PRESETS = {
  stable: { threshold: 0.65, silence_duration_ms: 800, prefix_padding_ms: 500 },
  fast: { threshold: 0.45, silence_duration_ms: 400, prefix_padding_ms: 300 },
};

const applyPreset = (name) => {
  const preset = PRESETS[name];
  if (!preset) return;
  if (els.maxChars) els.maxChars.value = preset.maxChars;
  if (els.gapMs) els.gapMs.value = preset.gapMs;
  if (els.vadSilence) els.vadSilence.value = preset.vadSilence;
  state.maxChars = preset.maxChars;
  state.gapMs = preset.gapMs;
  state.vadSilence = preset.vadSilence;
  localStorage.setItem('maxChars', state.maxChars);
  localStorage.setItem('gapMs', state.gapMs);
  localStorage.setItem('vadSilence', state.vadSilence);
  if (typeof setStatus === 'function') {
    setStatus(`preset: ${name}`);
  }
  addDiagLog(`Preset applied: ${name} | maxChars=${preset.maxChars} gapMs=${preset.gapMs} vadSilence=${preset.vadSilence}`);
  updateDevStatusSummary();
};

const setError = (text) => {
  if (els.error) {
    els.error.textContent = text || '';
  }
};

const numberOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const parseServerTimeMs = (serverTime) => {
  if (!serverTime) return null;
  const ms = Date.parse(serverTime);
  return Number.isFinite(ms) ? ms : null;
};

const updateServerTimeOffset = (serverTime) => {
  const serverMs = parseServerTimeMs(serverTime);
  if (serverMs == null) return;
  state.serverTimeOffsetMs = serverMs - Date.now();
};

const getServerNowMs = () => {
  if (typeof state.serverTimeOffsetMs !== 'number' || !Number.isFinite(state.serverTimeOffsetMs)) {
    return null;
  }
  return Date.now() + state.serverTimeOffsetMs;
};

const formatMinutes = (seconds) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '–';
  return Math.max(0, Math.floor(seconds / 60));
};

const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '–';
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const updateQuotaInfo = () => {
  if (!els.quotaInfo) return;
  if (!state.quota.loaded) {
    els.quotaInfo.textContent = '';
    return;
  }
  const totalText =
    typeof state.quota.totalAvailableThisMonth === 'number'
      ? `${formatMinutes(state.quota.totalAvailableThisMonth)}分`
      : '–分';
  if (state.quota.plan === 'free' && typeof state.quota.dailyRemainingSeconds === 'number') {
    const dailyText = `${formatMinutes(state.quota.dailyRemainingSeconds)}分`;
    // ジョブ数表示を追加
    const jobUsed = state.quota.dayJobUsed ?? 0;
    const jobLimit = state.quota.dayJobLimit ?? 10;
    const jobText = `ジョブ: ${jobUsed}/${jobLimit}回`;
    els.quotaInfo.textContent = `本日: ${dailyText} ${jobText} / 今月: ${totalText}`;
  } else {
    els.quotaInfo.textContent = `残り: ${totalText}`;
  }
};

const formatNextReset = (isoString) => {
  if (!isoString) return '–';
  try {
    const d = new Date(isoString);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '–';
  }
};

const updateQuotaBreakdown = () => {
  if (!els.quotaBreakdown) return;
  const q = state.quota;
  if (!q.loaded) {
    els.quotaBreakdown.textContent = '';
    updateBillingSection(false);
    return;
  }

  // XSS安全: createElement + textContent で構築
  els.quotaBreakdown.innerHTML = '';

  const planLabel = q.plan === 'pro' ? 'Pro' : 'Free';
  const dayMin = formatMinutes(q.dailyRemainingSeconds);
  const jobUsed = q.dayJobUsed ?? 0;
  const jobLimit = q.dayJobLimit ?? '∞';
  const monthlyMin = formatMinutes(q.baseRemainingThisMonth);
  const ticketMin = formatMinutes(q.creditSeconds);
  const totalMin = formatMinutes(q.totalAvailableThisMonth);
  const retentionDays = q.retentionDays ?? 7;
  const nextReset = formatNextReset(q.nextResetAt);

  const rows = [
    ['プラン:', planLabel],
    ['本日残り:', q.plan === 'free' ? `${dayMin}分` : '制限なし'],
    ['今日のジョブ:', q.plan === 'free' ? `${jobUsed}/${jobLimit}回` : '制限なし'],
    ['月間残り:', `${monthlyMin}分`],
    ['チケット残高:', `${ticketMin}分`],
    ['合計:', `${totalMin}分`, 'total'],
    ['保持期間:', `${retentionDays}日`],
    ['次回リセット:', nextReset, 'reset'],
  ];

  rows.forEach(([label, value, extraClass]) => {
    const row = document.createElement('div');
    row.className = 'breakdown-row' + (extraClass ? ` ${extraClass}` : '');
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    els.quotaBreakdown.appendChild(row);
  });

  // Show billing section for logged-in users
  updateBillingSection(currentUser != null);
};

// ========== Billing / Stripe Checkout ==========
const updateBillingSection = (show) => {
  if (!els.billingSection) return;
  els.billingSection.style.display = show ? 'block' : 'none';

  // Update button visibility based on current plan
  if (state.quota.loaded) {
    const isPro = state.quota.plan === 'pro';

    // Upgrade button: show for Free, hide for Pro
    if (els.upgradeProBtn) {
      if (isPro) {
        els.upgradeProBtn.style.display = 'none';
      } else {
        els.upgradeProBtn.style.display = '';
        els.upgradeProBtn.textContent = t('upgradeToPro');
        els.upgradeProBtn.disabled = false;
        els.upgradeProBtn.classList.remove('disabled');
      }
    }

    // Manage subscription button: show for Pro, hide for Free
    if (els.manageBillingBtn) {
      if (isPro) {
        els.manageBillingBtn.style.display = '';
        els.manageBillingBtn.textContent = t('manageSubscription');
        els.manageBillingBtn.disabled = false;
      } else {
        els.manageBillingBtn.style.display = 'none';
      }
    }

    // Buy ticket button: enabled for Pro, disabled for Free (visible to both)
    if (els.buyTicketBtn) {
      els.buyTicketBtn.style.display = '';
      if (isPro) {
        els.buyTicketBtn.textContent = t('buyTicket');
        els.buyTicketBtn.disabled = false;
        els.buyTicketBtn.classList.remove('disabled');
      } else {
        els.buyTicketBtn.textContent = t('buyTicketProOnly');
        els.buyTicketBtn.disabled = true;
        els.buyTicketBtn.classList.add('disabled');
      }
    }
  }

  // Show company section for logged-in users
  if (els.companySection) {
    els.companySection.style.display = show ? 'block' : 'none';
  }
};

// Refresh billing status from backend and update UI
const refreshBillingStatus = async () => {
  if (!currentUser) return;

  const statusEl = els.billingStatus;
  if (!statusEl) return;

  try {
    const token = await currentUser.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/billing/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    addDiagLog(`Billing status: ${JSON.stringify(data)}`);

    // Format date for display
    const formatDate = (isoString) => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        return d.toLocaleDateString(getUiLang() === 'en' ? 'en-US' : getUiLang() === 'zh-Hans' ? 'zh-CN' : 'ja-JP', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return '';
      }
    };

    // Build status message
    let message = '';
    let className = 'billing-status';

    if (data.isPastDue) {
      message = t('billingStatusPastDue');
      className = 'billing-status error';
    } else if (data.isCanceling) {
      message = t('billingStatusCanceling').replace('{date}', formatDate(data.currentPeriodEnd));
      className = 'billing-status pending';
    } else if (data.isPro) {
      message = t('billingStatusActive').replace('{date}', formatDate(data.currentPeriodEnd));
      className = 'billing-status success';
    } else {
      message = t('billingStatusFree');
      className = 'billing-status';
    }

    statusEl.textContent = message;
    statusEl.className = className;

    // Update button visibility based on fresh data
    if (els.upgradeProBtn) {
      els.upgradeProBtn.style.display = data.isPro ? 'none' : '';
    }
    if (els.manageBillingBtn) {
      els.manageBillingBtn.style.display = data.isPro ? '' : 'none';
    }

  } catch (err) {
    console.error('[refreshBillingStatus] Error:', err);
    addDiagLog(`Billing status error: ${err.message}`);
  }
};

const startCheckout = async () => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  const btn = els.upgradeProBtn;
  const statusEl = els.billingStatus;

  if (btn) {
    btn.disabled = true;
    btn.textContent = t('upgrading');
  }
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'billing-status';
  }

  try {
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/#/billing/success`;
    const cancelUrl = `${baseUrl}/#/billing/cancel`;

    const res = await authFetch('/api/v1/billing/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        successUrl,
        cancelUrl,
        email: currentUser.email || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Checkout failed (${res.status})`);
    }

    const data = await res.json();
    addDiagLog(`Checkout session created | sessionId=${data.sessionId}`);

    // Redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (err) {
    console.error('[startCheckout] Error:', err);
    addDiagLog(`Checkout error: ${err.message}`);
    if (statusEl) {
      statusEl.textContent = t('billingError') + ': ' + err.message;
      statusEl.className = 'billing-status error';
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('upgradeToPro');
    }
  }
};

// Open Stripe Customer Portal for subscription management
const openManageSubscription = async () => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  const btn = els.manageBillingBtn;
  const statusEl = els.billingStatus;

  if (btn) {
    btn.disabled = true;
    btn.textContent = t('upgrading');
  }
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'billing-status';
  }

  try {
    const returnUrl = `${window.location.origin}/#/settings`;

    const res = await authFetch('/api/v1/billing/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Portal failed (${res.status})`);
    }

    const data = await res.json();
    addDiagLog(`Portal session created`);

    // Redirect to Stripe Customer Portal
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned');
    }
  } catch (err) {
    console.error('[openManageSubscription] Error:', err);
    addDiagLog(`Portal error: ${err.message}`);
    if (statusEl) {
      statusEl.textContent = t('billingError') + ': ' + err.message;
      statusEl.className = 'billing-status error';
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('manageSubscription');
    }
  }
};

// Open ticket selection modal
const openTicketModal = () => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  // Check if user is Pro - Free users cannot buy tickets
  const isPro = state.quota.plan === 'pro';
  if (!isPro) {
    // Show hint in billingStatus and highlight upgrade button
    if (els.billingStatus) {
      els.billingStatus.textContent = t('proRequiredHint');
      els.billingStatus.className = 'billing-status error';
    }
    // Pulse the upgrade button to draw attention
    if (els.upgradeProBtn) {
      els.upgradeProBtn.classList.add('pulse');
      setTimeout(() => els.upgradeProBtn.classList.remove('pulse'), 2000);
    }
    return;
  }

  if (!els.ticketModal) return;

  // Clear any previous status
  if (els.ticketModalStatus) {
    els.ticketModalStatus.textContent = '';
    els.ticketModalStatus.className = 'billing-status';
  }

  // Re-enable all pack buttons
  els.ticketModal.querySelectorAll('.ticket-pack').forEach((btn) => {
    btn.disabled = false;
  });

  els.ticketModal.showModal();
};

// Close ticket modal
const closeTicketModal = () => {
  if (els.ticketModal) {
    els.ticketModal.close();
  }
};

// Handle ticket pack selection and checkout
const selectTicketPack = async (packId) => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  // Disable all pack buttons during checkout
  if (els.ticketModal) {
    els.ticketModal.querySelectorAll('.ticket-pack').forEach((btn) => {
      btn.disabled = true;
    });
  }

  const statusEl = els.ticketModalStatus;
  if (statusEl) {
    statusEl.textContent = t('purchasing');
    statusEl.className = 'billing-status pending';
  }

  try {
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/#/tickets/success`;
    const cancelUrl = `${baseUrl}/#/tickets/cancel`;

    const res = await authFetch('/api/v1/billing/stripe/tickets/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packId,
        successUrl,
        cancelUrl,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Handle pro_required error specifically
      if (data.detail === 'pro_required') {
        throw new Error(t('proRequired'));
      }
      throw new Error(data.detail || `Ticket checkout failed (${res.status})`);
    }

    const data = await res.json();
    addDiagLog(`Ticket checkout session created | packId=${packId} sessionId=${data.sessionId}`);

    // Close modal and redirect to Stripe Checkout
    closeTicketModal();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (err) {
    console.error('[selectTicketPack] Error:', err);
    addDiagLog(`Ticket checkout error: ${err.message}`);
    if (statusEl) {
      statusEl.textContent = t('ticketCheckoutError') + ': ' + err.message;
      statusEl.className = 'billing-status error';
    }
    // Re-enable pack buttons
    if (els.ticketModal) {
      els.ticketModal.querySelectorAll('.ticket-pack').forEach((btn) => {
        btn.disabled = false;
      });
    }
  }
};

// ========== Company Profile ==========
const loadCompanyProfile = async () => {
  if (!currentUser) return;

  try {
    const token = await currentUser.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/company/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const profile = data.companyProfile || {};

    // Populate form fields
    if (els.companyName) els.companyName.value = profile.companyName || '';
    if (els.companyDepartment) els.companyDepartment.value = profile.department || '';
    if (els.companyPosition) els.companyPosition.value = profile.position || '';
    if (els.companyAddress) els.companyAddress.value = profile.address || '';
    if (els.companyPostalCode) els.companyPostalCode.value = profile.postalCode || '';
    if (els.companyCountry) els.companyCountry.value = profile.country || '';
    if (els.companyTaxIdLabel) els.companyTaxIdLabel.value = profile.taxIdLabel || '';
    if (els.companyTaxIdValue) els.companyTaxIdValue.value = profile.taxIdValue || '';

    addDiagLog('Company profile loaded');
  } catch (err) {
    console.error('[loadCompanyProfile] Error:', err);
    addDiagLog(`Company profile load error: ${err.message}`);
  }
};

const saveCompanyProfile = async () => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  const btn = els.saveCompanyBtn;
  const statusEl = els.companyStatus;

  if (btn) btn.disabled = true;
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'company-status';
  }

  const companyProfile = {
    companyName: els.companyName?.value?.trim() || '',
    department: els.companyDepartment?.value?.trim() || '',
    position: els.companyPosition?.value?.trim() || '',
    address: els.companyAddress?.value?.trim() || '',
    postalCode: els.companyPostalCode?.value?.trim() || '',
    country: els.companyCountry?.value?.trim() || '',
    taxIdLabel: els.companyTaxIdLabel?.value?.trim() || '',
    taxIdValue: els.companyTaxIdValue?.value?.trim() || '',
  };

  try {
    const token = await currentUser.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/company/profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyProfile }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const stripeSync = data.stripeSync || {};

    // Determine message based on Stripe sync result
    let message = t('companySaved');
    if (stripeSync.updated) {
      message = t('companySavedWithStripe');
    } else if (stripeSync.skipped) {
      message = t('companySavedStripeSkipped');
    }

    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'company-status success';
    }
    addDiagLog(`Company profile saved | stripeSync: ${JSON.stringify(stripeSync)}`);

    // Clear status after 3 seconds
    setTimeout(() => {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'company-status';
      }
    }, 3000);
  } catch (err) {
    console.error('[saveCompanyProfile] Error:', err);
    addDiagLog(`Company profile save error: ${err.message}`);
    if (statusEl) {
      statusEl.textContent = t('companySaveError');
      statusEl.className = 'company-status error';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
};

// ========== Company Edit Modal ==========
const openCompanyEditModal = () => {
  if (els.companyEditModal) {
    els.companyEditModal.showModal();
    loadCompanyProfile();
  }
};

const closeCompanyEditModal = () => {
  if (els.companyEditModal) {
    els.companyEditModal.close();
  }
};

// ========== Dictionary UI ==========
const DICTIONARY_LIMIT_FREE = 10;
const DICTIONARY_LIMIT_PRO = 1000;

const getDictionaryLimit = () => (state.quota?.plan === 'pro' ? DICTIONARY_LIMIT_PRO : DICTIONARY_LIMIT_FREE);

const updateDictionarySummary = () => {
  if (!els.dictionaryCountDisplay) return;
  const limit = getDictionaryLimit();
  const count = dictItems.length;
  const moreSuffix = dictNextCursor ? '+' : '';
  els.dictionaryCountDisplay.textContent = `辞書: ${count}${moreSuffix}/${limit}`;
};

let dictNextCursor = null;
let dictItems = [];

const loadDictionaryList = async (append = false) => {
  if (!currentUser) return;

  if (!append) {
    dictItems = [];
    dictNextCursor = null;
    if (els.dictTableBody) els.dictTableBody.innerHTML = '';
  }

  if (els.dictListLoading) els.dictListLoading.style.display = 'block';
  if (els.dictListEmpty) els.dictListEmpty.style.display = 'none';
  if (els.dictTable) els.dictTable.style.display = 'none';
  if (els.dictLoadMore) els.dictLoadMore.style.display = 'none';

  try {
    const dictLimit = getDictionaryLimit();
    let url = `/api/v1/dictionary?limit=${dictLimit}`;
    if (append && dictNextCursor) {
      url += `&cursor=${encodeURIComponent(dictNextCursor)}`;
    }

    const res = await authFetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail?.message || 'Failed to load dictionary');
    }

    const items = data.items || [];
    dictNextCursor = data.nextCursor || null;

    if (append) {
      dictItems = [...dictItems, ...items];
    } else {
      dictItems = items;
    }

    updateDictionarySummary();
    renderDictionaryTable();
    addDiagLog(`Dictionary loaded: ${dictItems.length} items`);
  } catch (err) {
    console.error('[loadDictionaryList] Error:', err);
    addDiagLog(`Dictionary load error: ${err.message}`);
  } finally {
    if (els.dictListLoading) els.dictListLoading.style.display = 'none';
  }
};

const renderDictionaryTable = () => {
  if (!els.dictTableBody) return;

  if (dictItems.length === 0) {
    if (els.dictListEmpty) els.dictListEmpty.style.display = 'block';
    if (els.dictTable) els.dictTable.style.display = 'none';
    if (els.dictLoadMore) els.dictLoadMore.style.display = 'none';
    if (els.dictListCount) els.dictListCount.textContent = '';
    return;
  }

  if (els.dictListEmpty) els.dictListEmpty.style.display = 'none';
  if (els.dictTable) els.dictTable.style.display = 'table';
  if (els.dictListCount) els.dictListCount.textContent = `(${dictItems.length}件)`;

  els.dictTableBody.innerHTML = '';
  for (const item of dictItems) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;

    tr.innerHTML = `
      <td class="dict-cell-source">${escapeHtml(item.source)}</td>
      <td class="dict-cell-target">${escapeHtml(item.target)}</td>
      <td class="dict-cell-note">${escapeHtml(item.note || '')}</td>
      <td class="dict-cell-actions">
        <button class="dict-edit-btn secondary small" data-id="${item.id}">編集</button>
        <button class="dict-delete-btn secondary small danger" data-id="${item.id}">削除</button>
      </td>
    `;
    els.dictTableBody.appendChild(tr);
  }

  // Show/hide load more button
  if (els.dictLoadMore) {
    els.dictLoadMore.style.display = dictNextCursor ? 'block' : 'none';
  }
};

const escapeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const addDictionaryEntry = async () => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  const source = els.dictAddSource?.value?.trim() || '';
  const target = els.dictAddTarget?.value?.trim() || '';
  const note = els.dictAddNote?.value?.trim() || '';

  if (!source || !target) {
    if (els.dictAddResult) {
      els.dictAddResult.textContent = 'source と target は必須です';
      els.dictAddResult.className = 'upload-result error';
    }
    return;
  }

  if (els.dictAddBtn) els.dictAddBtn.disabled = true;
  if (els.dictAddResult) els.dictAddResult.textContent = '';

  try {
    const res = await authFetch('/api/v1/dictionary/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target, note }),
    });
    const data = await res.json();

    if (res.ok) {
      if (els.dictAddResult) {
        els.dictAddResult.textContent = `追加しました (${data.count}/${data.limit})`;
        els.dictAddResult.className = 'upload-result success';
      }
      // Clear inputs
      if (els.dictAddSource) els.dictAddSource.value = '';
      if (els.dictAddTarget) els.dictAddTarget.value = '';
      if (els.dictAddNote) els.dictAddNote.value = '';
      // Reload list
      loadDictionaryList();
      addDiagLog(`Dictionary entry added: ${source}`);
    } else {
      const reason = data.detail?.reason || data.detail?.message || 'エラー';
      if (els.dictAddResult) {
        els.dictAddResult.textContent = `エラー: ${reason}`;
        els.dictAddResult.className = 'upload-result error';
      }
      addDiagLog(`Dictionary add failed: ${reason}`);
    }
  } catch (err) {
    if (els.dictAddResult) {
      els.dictAddResult.textContent = `エラー: ${err.message}`;
      els.dictAddResult.className = 'upload-result error';
    }
    addDiagLog(`Dictionary add error: ${err.message}`);
  } finally {
    if (els.dictAddBtn) els.dictAddBtn.disabled = false;
  }
};

const editDictionaryEntry = async (id) => {
  const item = dictItems.find(i => i.id === id);
  if (!item) return;

  const newSource = prompt('source:', item.source);
  if (newSource === null) return;
  const newTarget = prompt('target:', item.target);
  if (newTarget === null) return;
  const newNote = prompt('note:', item.note || '');
  if (newNote === null) return;

  if (!newSource.trim() || !newTarget.trim()) {
    alert('source と target は必須です');
    return;
  }

  try {
    const res = await authFetch(`/api/v1/dictionary/entry/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: newSource.trim(),
        target: newTarget.trim(),
        note: newNote.trim(),
      }),
    });
    const data = await res.json();

    if (res.ok) {
      loadDictionaryList();
      addDiagLog(`Dictionary entry updated: ${id}`);
    } else {
      const reason = data.detail?.reason || data.detail?.message || 'エラー';
      alert(`エラー: ${reason}`);
      addDiagLog(`Dictionary update failed: ${reason}`);
    }
  } catch (err) {
    alert(`エラー: ${err.message}`);
    addDiagLog(`Dictionary update error: ${err.message}`);
  }
};

const deleteDictionaryEntry = async (id) => {
  if (!confirm('この単語を削除しますか？')) return;

  try {
    const res = await authFetch(`/api/v1/dictionary/entry/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (res.ok) {
      loadDictionaryList();
      addDiagLog(`Dictionary entry deleted: ${id}`);
    } else {
      const reason = data.detail?.reason || data.detail?.message || 'エラー';
      alert(`エラー: ${reason}`);
      addDiagLog(`Dictionary delete failed: ${reason}`);
    }
  } catch (err) {
    alert(`エラー: ${err.message}`);
    addDiagLog(`Dictionary delete error: ${err.message}`);
  }
};

const downloadDictionaryTemplate = async () => {
  if (!currentUser) {
    setError(t('errorLoginRequired'));
    return;
  }

  try {
    const res = await authFetch('/api/v1/dictionary/template.csv');

    if (!res.ok) {
      throw new Error('Failed to download template');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dictionary_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addDiagLog('Dictionary template downloaded');
  } catch (err) {
    console.error('[downloadDictionaryTemplate] Error:', err);
    alert(`ダウンロードエラー: ${err.message}`);
    addDiagLog(`Dictionary template download error: ${err.message}`);
  }
};

// Poll for plan update after successful checkout
const pollForPlanUpdate = async (maxAttempts = 12, intervalMs = 5000) => {
  for (let i = 0; i < maxAttempts; i++) {
    await refreshQuotaStatus();
    if (state.quota.plan === 'pro') {
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
};

const pollForQuotaUpdate = async (maxAttempts = 5, intervalMs = 5000) => {
  const initialPlan = state.quota.plan;
  const initialCredit = typeof state.quota.creditSeconds === 'number' ? state.quota.creditSeconds : null;

  for (let i = 0; i < maxAttempts; i++) {
    const data = await refreshQuotaStatus();
    if (data) {
      const nextPlan = data.plan || state.quota.plan;
      const nextCredit = typeof data.creditSeconds === 'number' ? data.creditSeconds : null;
      const planChanged = initialPlan && nextPlan && nextPlan !== initialPlan;
      const creditIncreased =
        typeof initialCredit === 'number' && typeof nextCredit === 'number' && nextCredit > initialCredit;
      const creditNowAvailable = initialCredit == null && typeof nextCredit === 'number' && nextCredit > 0;
      if (planChanged || creditIncreased || creditNowAvailable) {
        return true;
      }
    }
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  return false;
};

// ========== Dictionary View (Hash Route #/dictionary) ==========
const showDictionaryView = () => {
  if (els.dictionaryView && els.appShell) {
    els.appShell.style.display = 'none';
    els.dictionaryView.style.display = 'block';
    // Load dictionary list when showing view (with fallback to prevent crash)
    if (typeof loadDictionaryPage === 'function') {
      loadDictionaryPage(true);
    } else if (typeof loadDictionaryList === 'function') {
      loadDictionaryList();
    } else {
      console.warn('[showDictionaryView] No dictionary load function available');
    }
  }
};

const hideDictionaryView = () => {
  if (els.dictionaryView && els.appShell) {
    els.dictionaryView.style.display = 'none';
    els.appShell.style.display = 'block';
  }
};

const navigateToDictionary = () => {
  // Close settings modal first if open
  if (els.settingsModal?.open) {
    els.settingsModal.close();
  }
  window.location.hash = '#/dictionary';
};

const navigateBackFromDictionary = () => {
  // Try history.back(), fallback to clearing hash if no history
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.hash = '';
    hideDictionaryView();
  }
};

const clearElement = (el) => {
  if (!el) return;
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};

const getRetentionDays = () => (state.quota?.plan === 'pro' ? 30 : 7);

const getSessionTimestampInfo = (session) => {
  if (!session) return null;
  if (typeof session.serverTimestampMs === 'number' && Number.isFinite(session.serverTimestampMs)) {
    return { ts: session.serverTimestampMs, confidence: 'high' };
  }
  if (typeof session.timestamp === 'number' && Number.isFinite(session.timestamp)) {
    return { ts: session.timestamp, confidence: 'low' };
  }
  return null;
};

const isSessionExpired = (session) => {
  const nowMs = getServerNowMs();
  if (!nowMs) return false;
  const tsInfo = getSessionTimestampInfo(session);
  if (!tsInfo) return false;
  // クライアント時刻のみの場合は誤判定を避けるため表示側に倒す
  if (tsInfo.confidence !== 'high') return false;
  const retentionMs = getRetentionDays() * 24 * 60 * 60 * 1000;
  return nowMs - tsInfo.ts >= retentionMs;
};

// ========== History View Navigation ==========
const navigateToHistory = () => {
  window.location.hash = '#/history';
};

const navigateBackFromHistory = () => {
  // 決め打ちでメイン画面へ遷移（history.back() は履歴スタック依存で不安定）
  window.location.hash = '#/';
};

const navigateBackFromHistoryDetail = () => {
  window.location.hash = '#/history';
};

const buildHistoryMetaText = (session) => {
  const parts = [];
  if (session?.timestamp != null) {
    parts.push(`${t('historyCreatedLabel')}${formatTimestamp(session.timestamp)}`);
  }
  const inputLang = session?.inputLang || 'auto';
  const outputLang = session?.outputLang || 'ja';
  parts.push(`${t('historyLangLabel')}${inputLang} → ${outputLang}`);
  const durationText = formatDuration(session?.durationSeconds);
  if (durationText !== '–') {
    parts.push(`${t('historyDurationLabel')}${durationText}`);
  }
  const utterances = Array.isArray(session?.originals) ? session.originals.length : 0;
  parts.push(`${t('historyUtterancesLabel')}${utterances}`);
  return parts.join(' • ');
};

const handleHistoryListClick = (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;

  if (btn.classList.contains('hist-detail-btn')) {
    window.location.hash = `#/history/${id}`;
  } else if (btn.classList.contains('hist-delete-btn')) {
    deleteHistoryEntry(id);
  }
};

const showHistoryView = async () => {
  if (!els.historyView) return;
  if (els.appShell) els.appShell.style.display = 'none';
  els.historyView.style.display = 'block';
  await loadHistoryList();
};

const hideHistoryView = () => {
  if (!els.historyView) return;
  els.historyView.style.display = 'none';
  if (els.appShell) els.appShell.style.display = 'flex';
};

const loadHistoryList = async () => {
  if (!els.historyList || !els.historyListLoading || !els.historyListEmpty) return;

  els.historyListLoading.style.display = 'block';
  els.historyList.style.display = 'none';
  els.historyListEmpty.style.display = 'none';

  try {
    const sessions = await historyStorage.getAll();
    const visibleSessions = sessions.filter((session) => !isSessionExpired(session));

    els.historyListLoading.style.display = 'none';

    if (sessions.length === 0) {
      if (state.historyEmptyDefault) {
        els.historyListEmpty.textContent = state.historyEmptyDefault;
      }
      els.historyListEmpty.style.display = 'block';
      return;
    }

    if (visibleSessions.length === 0) {
      els.historyListEmpty.textContent = t('historyEmptyFiltered');
      els.historyListEmpty.style.display = 'block';
      return;
    }

    clearElement(els.historyList);
    visibleSessions.forEach((session) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const info = document.createElement('div');
      info.className = 'history-item-info';

      const title = document.createElement('div');
      title.className = 'history-item-title';
      title.textContent = session.title || 'Untitled';

      const meta = document.createElement('div');
      meta.className = 'history-item-meta';
      meta.textContent = buildHistoryMetaText(session);

      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'history-item-actions';

      const detailBtn = document.createElement('button');
      detailBtn.className = 'secondary small hist-detail-btn';
      detailBtn.dataset.id = session.id;
      detailBtn.textContent = '詳細';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'secondary small danger hist-delete-btn';
      deleteBtn.dataset.id = session.id;
      deleteBtn.textContent = '削除';

      actions.appendChild(detailBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(info);
      item.appendChild(actions);
      els.historyList.appendChild(item);
    });

    if (!state.historyListBound) {
      els.historyList.addEventListener('click', handleHistoryListClick);
      state.historyListBound = true;
    }

    els.historyList.style.display = 'flex';
  } catch (err) {
    els.historyListLoading.style.display = 'none';
    els.historyListEmpty.textContent = `エラー: ${err.message}`;
    els.historyListEmpty.style.display = 'block';
    addDiagLog(`History load error: ${err.message}`);
  }
};

const deleteHistoryEntry = async (id) => {
  if (!confirm('この履歴を削除しますか？')) return;
  try {
    await historyStorage.delete(id);
    addDiagLog(`History deleted: ${id}`);
    await loadHistoryList();
  } catch (err) {
    setError(`削除エラー: ${err.message}`);
  }
};

const showHistoryDetailView = async (sessionId) => {
  if (!els.historyDetailView || !els.historyDetailContent) return;

  hideHistoryView();
  els.historyDetailView.style.display = 'block';

  try {
    const session = await historyStorage.get(sessionId);
    if (!session) {
      if (els.historyDetailTitle) {
        els.historyDetailTitle.textContent = 'セッション詳細';
      }
      clearElement(els.historyDetailContent);
      const notFound = document.createElement('p');
      notFound.textContent = 'セッションが見つかりません';
      els.historyDetailContent.appendChild(notFound);
      return;
    }

    if (isSessionExpired(session)) {
      if (els.historyDetailTitle) {
        els.historyDetailTitle.textContent = 'セッション詳細';
      }
      clearElement(els.historyDetailContent);
      const expired = document.createElement('p');
      expired.textContent = t('historyExpired');
      els.historyDetailContent.appendChild(expired);
      return;
    }

    if (els.historyDetailTitle) {
      els.historyDetailTitle.textContent = session.title || 'セッション詳細';
    }

    const originals = (session.originals || []).join('\n');
    const translations = (session.translations || []).join('\n');
    const bilingual = (session.originals || [])
      .map((orig, idx) => `${orig}\n${(session.translations || [])[idx] || ''}`)
      .join('\n\n');

    clearElement(els.historyDetailContent);

    const appendSection = (titleText, bodyEl) => {
      const section = document.createElement('div');
      section.className = 'history-detail-section';
      const heading = document.createElement('h4');
      heading.textContent = titleText;
      section.appendChild(heading);
      if (bodyEl) section.appendChild(bodyEl);
      els.historyDetailContent.appendChild(section);
    };

    const infoText = document.createElement('div');
    infoText.className = 'history-detail-text';
    const durationText = formatDuration(session.durationSeconds);
    const utterances = Array.isArray(session.originals) ? session.originals.length : 0;
    infoText.textContent = [
      `${t('historyCreatedLabel')}${formatTimestamp(session.timestamp)}`,
      `${t('inputLangLabel')}: ${session.inputLang || 'auto'}`,
      `${t('outputLangLabel')}: ${session.outputLang || 'ja'}`,
      `${t('historyDurationLabel')}${durationText}`,
      `${t('historyUtterancesLabel')}${utterances}`,
    ].join('\n');
    appendSection('情報', infoText);

    const originalText = document.createElement('div');
    originalText.className = 'history-detail-text';
    originalText.textContent = originals ? originals : t('historyNoOriginal');
    appendSection('原文', originalText);

    const translationText = document.createElement('div');
    translationText.className = 'history-detail-text';
    translationText.textContent = translations ? translations : t('historyNoTranslation');
    appendSection('翻訳', translationText);

    if (session.summary) {
      const summaryText = document.createElement('div');
      summaryText.className = 'history-detail-text';
      summaryText.textContent = session.summary;
      appendSection('要約', summaryText);
    }

    const downloadSection = document.createElement('div');
    downloadSection.className = 'history-detail-section';
    const downloadHeading = document.createElement('h4');
    downloadHeading.textContent = 'ダウンロード';
    const downloadContainer = document.createElement('div');
    downloadContainer.className = 'history-detail-downloads';
    downloadContainer.id = 'historyDetailDownloads';
    downloadSection.appendChild(downloadHeading);
    downloadSection.appendChild(downloadContainer);
    els.historyDetailContent.appendChild(downloadSection);

    // Add download buttons
    if (downloadContainer) {
      const files = [];
      const tsFilename = formatTimestampForFilename(session.timestamp);

      if (session.m4aUrl) {
        files.push({ label: '🎵 M4A', url: session.m4aUrl, download: `${tsFilename}.m4a` });
      }
      if (originals) {
        const url = URL.createObjectURL(new Blob([originals], { type: 'text/plain' }));
        state.objectUrls.push(url);
        files.push({ label: '📝 原文', url, download: `原文_${tsFilename}.txt` });
      }
      if (bilingual) {
        const url = URL.createObjectURL(new Blob([bilingual], { type: 'text/plain' }));
        state.objectUrls.push(url);
        files.push({ label: '🌐 原文+翻訳', url, download: `原文+翻訳_${tsFilename}.txt` });
      }
      if (session.summary) {
        const url = URL.createObjectURL(new Blob([session.summary], { type: 'text/markdown' }));
        state.objectUrls.push(url);
        files.push({ label: '📋 要約', url, download: `要約_${tsFilename}.md` });
      }

      files.forEach((file) => {
        const btn = document.createElement('a');
        btn.href = file.url;
        btn.download = file.download;
        btn.className = 'result-file-btn';
        btn.textContent = file.label;
        downloadContainer.appendChild(btn);
      });
    }
  } catch (err) {
    clearElement(els.historyDetailContent);
    const errorMsg = document.createElement('p');
    errorMsg.textContent = `エラー: ${err.message}`;
    els.historyDetailContent.appendChild(errorMsg);
    addDiagLog(`History detail error: ${err.message}`);
  }
};

const hideHistoryDetailView = () => {
  if (!els.historyDetailView) return;
  els.historyDetailView.style.display = 'none';
  // Revoke temporary blob URLs created in history detail view
  if (state.objectUrls && state.objectUrls.length > 0) {
    state.objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore revoke errors
      }
    });
    state.objectUrls = [];
  }
};

// Handle hash routes (#/dictionary, #/history, #/history/:id, #/billing/*, #/tickets/*)
// ルーティング: #/ or '' => メイン, #/history => 履歴一覧, #/history/<id> => 履歴詳細
const handleHashRoute = async () => {
  const hash = window.location.hash || '';

  // メイン画面（#/ or '' or #）
  if (hash === '#/' || hash === '' || hash === '#') {
    hideDictionaryView();
    hideHistoryView();
    hideHistoryDetailView();
    if (els.appShell) els.appShell.style.display = 'flex';
    return;
  }

  // Dictionary view route
  if (hash === '#/dictionary') {
    hideHistoryView();
    hideHistoryDetailView();
    showDictionaryView();
    return;
  } else {
    hideDictionaryView();
  }

  // History view routes（厳密に分岐）
  if (hash === '#/history') {
    hideHistoryDetailView();
    showHistoryView();
    return;
  }
  // #/history/<sessionId> のパターン
  const historyDetailMatch = hash.match(/^#\/history\/(.+)$/);
  if (historyDetailMatch && historyDetailMatch[1]) {
    const sessionId = historyDetailMatch[1];
    showHistoryDetailView(sessionId);
    return;
  }

  // それ以外のルート: 全ビューを非表示にしてメイン表示
  hideHistoryView();
  hideHistoryDetailView();

  if (hash === '#/billing/success') {
    // Show success banner with polling
    showBillingBanner('pending');
    const upgraded = await pollForPlanUpdate();
    if (upgraded) {
      showBillingBanner('success');
      addDiagLog('Billing: Plan upgraded to Pro');
      await refreshQuotaStatus();
      refreshBillingStatus();
    } else {
      showBillingBanner('pending-timeout');
      addDiagLog('Billing: Polling timeout, plan not yet updated');
    }
    // Clean up hash
    history.replaceState(null, '', window.location.pathname);
  } else if (hash === '#/billing/cancel') {
    showBillingBanner('cancelled');
    addDiagLog('Billing: Checkout cancelled');
    history.replaceState(null, '', window.location.pathname);
  } else if (hash === '#/tickets/success') {
    // Ticket purchase success - refresh quota to show new balance
    showBillingBanner('ticket-success');
    addDiagLog('Tickets: Purchase successful');
    const updated = await pollForQuotaUpdate();
    if (!updated) {
      showBillingBanner('pending-timeout');
      addDiagLog('Tickets: Polling timeout, quota not yet updated');
    }
    history.replaceState(null, '', window.location.pathname);
  } else if (hash === '#/tickets/cancel') {
    showBillingBanner('ticket-cancelled');
    addDiagLog('Tickets: Purchase cancelled');
    history.replaceState(null, '', window.location.pathname);
  }
};

// Backward compatibility alias
const handleBillingRoute = handleHashRoute;

const showBillingBanner = (status) => {
  // Remove existing banner
  const existing = document.querySelector('.billing-success-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'billing-success-banner';

  let message = '';
  let showClose = true;

  switch (status) {
    case 'success':
      message = t('billingSuccess');
      break;
    case 'pending':
      message = t('billingPending');
      banner.classList.add('pending');
      showClose = false;
      break;
    case 'pending-timeout':
      message = t('billingSyncDelayed');
      banner.classList.add('pending');
      break;
    case 'cancelled':
      message = t('billingCancelled');
      break;
    case 'ticket-success':
      message = t('ticketSuccess');
      break;
    case 'ticket-cancelled':
      message = t('ticketCancelled');
      break;
    default:
      message = status;
  }

  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  banner.appendChild(messageEl);

  if (showClose) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => banner.remove());
    banner.appendChild(closeBtn);
  }

  document.body.prepend(banner);

  // Auto-remove after delay (except for pending without timeout)
  if (status !== 'pending') {
    setTimeout(() => banner.remove(), status === 'success' ? 5000 : 3000);
  }
};

// P0-2: ネットワーク断のUI通知バナー（XSS対策: innerHTML不使用）
const showNetworkDisconnectBanner = () => {
  const existing = document.querySelector('.network-disconnect-banner');
  if (existing) return; // 二重表示防止

  const banner = document.createElement('div');
  banner.className = 'network-disconnect-banner';

  const span = document.createElement('span');
  span.textContent = t('networkDisconnected');

  const btn = document.createElement('button');
  btn.textContent = '✕';
  btn.addEventListener('click', () => banner.remove());

  banner.append(span, btn);
  document.body.prepend(banner);
  addDiagLog('[net] Network disconnect banner shown');
};

const hideNetworkDisconnectBanner = () => {
  const banner = document.querySelector('.network-disconnect-banner');
  if (banner) {
    banner.remove();
    addDiagLog('[net] Network disconnect banner hidden');
  }
};

// ネットワーク切断処理のデバウンス
const DISCONNECT_DEBOUNCE_MS = 500;
let _disconnectDebounceTimer = null;
let _disconnectHandled = false;

const handleNetworkDisconnectOnce = (reason) => {
  if (_disconnectHandled) {
    addDiagLog(`[net] Disconnect already handled, ignoring: ${reason}`);
    return;
  }
  if (_disconnectDebounceTimer) {
    clearTimeout(_disconnectDebounceTimer);
  }
  _disconnectDebounceTimer = setTimeout(() => {
    _disconnectHandled = true;
    addDiagLog(`[net] Disconnect handled: ${reason}`);
    showNetworkDisconnectBanner();
    setStatus('Standby');

    // ジョブがあれば pending finalize に保存（即実行しない）
    // state.currentJob は保持し、jobActive=false にするだけ
    if (state.currentJob && state.jobActive) {
      state._pendingJobFinalize = {
        jobId: state.currentJob.jobId,
        audioSeconds: getJobElapsedSeconds(),
      };
      addDiagLog(`[job] Pending finalize saved: jobId=${state._pendingJobFinalize.jobId}`);
      state.jobActive = false; // ジョブを非アクティブに
    }
  }, DISCONNECT_DEBOUNCE_MS);
};

const resetDisconnectState = () => {
  _disconnectHandled = false;
  if (_disconnectDebounceTimer) {
    clearTimeout(_disconnectDebounceTimer);
    _disconnectDebounceTimer = null;
  }
};

// online復帰時のpending job finalize
const tryFinalizePendingJob = async () => {
  if (!state._pendingJobFinalize) return;
  if (!navigator.onLine) {
    addDiagLog('[job] Skipping finalize: still offline');
    return;
  }

  const pending = state._pendingJobFinalize;
  const attempts = pending._attempts || 0;

  // 最大1回再試行（2回目以降は破棄）
  if (attempts >= 1) {
    addDiagLog(`[job] Pending finalize max attempts reached, discarding: jobId=${pending.jobId}`);
    state.currentJob = null;
    state.jobStartedAt = null;
    state._pendingJobFinalize = null;
    return;
  }

  const { jobId, audioSeconds } = pending;
  addDiagLog(`[job] Attempting pending finalize: jobId=${jobId} attempt=${attempts + 1}`);

  // completeCurrentJob と同じ形式でpayloadを構築
  const payload = { jobId };
  if (typeof audioSeconds === 'number' && Number.isFinite(audioSeconds)) {
    payload.audioSeconds = Math.max(0, Math.round(audioSeconds));
  }

  try {
    const res = await authFetch('/api/v1/jobs/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      applyQuotaFromPayload(data);
      addDiagLog(`[job] Pending finalize success: jobId=${jobId} billed=${data.billedSeconds ?? 'n/a'}s`);
      // 成功時のみstateクリア
      state.currentJob = null;
      state.jobStartedAt = null;
      state._pendingJobFinalize = null;
    } else {
      addDiagLog(`[job] Pending finalize failed: jobId=${jobId} status=${res.status}`);
      // 失敗時は保持、attemptsをインクリメント
      state._pendingJobFinalize._attempts = attempts + 1;
    }
  } catch (err) {
    addDiagLog(`[job] Pending finalize error: ${err.message}`);
    // エラー時も保持、attemptsをインクリメント
    state._pendingJobFinalize._attempts = attempts + 1;
  }
};

const applyQuotaFromPayload = (payload = {}) => {
  updateServerTimeOffset(payload.serverTime);
  const next = {
    plan: payload.plan || state.quota.plan || 'free',
    baseRemainingThisMonth: numberOrNull(payload.baseRemainingThisMonth),
    totalAvailableThisMonth: numberOrNull(payload.totalAvailableThisMonth),
    baseDailyQuotaSeconds: numberOrNull(payload.baseDailyQuotaSeconds),
    dailyRemainingSeconds: numberOrNull(payload.dailyRemainingSeconds),
    creditSeconds: numberOrNull(payload.creditSeconds),
    maxSessionSeconds: numberOrNull(
      payload.maxSessionSeconds != null ? payload.maxSessionSeconds : state.quota.maxSessionSeconds,
    ),
    nextResetAt: payload.nextResetAt || null,
    blockedReason: payload.blockedReason || null,
    // 新規フィールド
    dayJobLimit: payload.dayJobLimit ?? null,
    dayJobUsed: payload.dayJobUsed ?? 0,
    dayJobRemaining: payload.dayJobRemaining ?? null,
    retentionDays: payload.retentionDays ?? 7,
    concurrentLimit: payload.concurrentLimit ?? 1,
    concurrentActive: payload.concurrentActive ?? 0,
    billingEnabled: payload.billingEnabled ?? true,
    purchaseAvailable: payload.purchaseAvailable ?? true,
    loaded: true,
  };
  state.quota = next;
  updateQuotaInfo();
  updateQuotaBreakdown();
  updateDevStatusSummary();
};

const resetQuotaState = () => {
  state.quota = createDefaultQuotaState();
  state.currentJob = null;
  state.jobStartedAt = null;
  state.serverTimeOffsetMs = null;
  updateQuotaInfo();
  updateQuotaBreakdown();
  updateDevStatusSummary();
};

const extractErrorMessage = (payload, fallback = 'エラーが発生しました。') => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload.detail === 'string') return payload.detail;
  if (payload.detail && typeof payload.detail === 'object') {
    if (typeof payload.detail.message === 'string') return payload.detail.message;
    if (typeof payload.detail.error === 'string') return payload.detail.error;
  }
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.error === 'string') return payload.error;
  return fallback;
};

const refreshQuotaStatus = async () => {
  if (!currentUser) {
    resetQuotaState();
    return null;
  }
  try {
    const res = await authFetch('/api/v1/me', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = extractErrorMessage(data, '利用残量の取得に失敗しました。');
      throw new Error(message || 'quota fetch failed');
    }
    applyQuotaFromPayload(data);
    const totalMinutes = formatMinutes(state.quota.totalAvailableThisMonth);
    const dailyMinutes =
      state.quota.plan === 'free' && typeof state.quota.dailyRemainingSeconds === 'number'
        ? formatMinutes(state.quota.dailyRemainingSeconds)
        : null;
    addDiagLog(
      `Quota refreshed | total=${totalMinutes}m` + (dailyMinutes !== null ? ` daily=${dailyMinutes}m` : ''),
    );
    return data;
  } catch (err) {
    addDiagLog(`Quota fetch failed: ${err.message || err}`);
    return null;
  }
};

const blockedReasonMessages = {
  monthly_quota_exhausted: '今月の利用可能時間が残っていません。',
  daily_limit_reached: 'Freeプランの本日の利用上限(10分)に達しました。',
  daily_job_limit_reached: 'Freeプランの本日のジョブ作成上限(10回)に達しました。',
};

// ========== Connection Error Categories ==========
const ERROR_CATEGORY = {
  MIC_PERMISSION: 'mic_permission',
  TOKEN_AUTH: 'token_auth',
  REALTIME_NEGOTIATE: 'realtime_negotiate',
  ICE_FAILED: 'ice_failed',
  CONNECTION_TIMEOUT: 'connection_timeout',
  NETWORK: 'network',
  RATE_LIMIT: 'rate_limit',
  SERVER_ERROR: 'server_error',
  UNKNOWN: 'unknown',
};

// P0-1: 多言語対応エラーメッセージ
const ERROR_MESSAGES = {
  ja: {
    [ERROR_CATEGORY.MIC_PERMISSION]: 'マイクの使用が許可されていません。ブラウザの設定でマイクへのアクセスを許可してください。',
    [ERROR_CATEGORY.TOKEN_AUTH]: '認証エラーが発生しました。再ログインしてください。',
    [ERROR_CATEGORY.REALTIME_NEGOTIATE]: 'リアルタイム接続の確立に失敗しました。しばらくしてから再試行してください。',
    [ERROR_CATEGORY.ICE_FAILED]: '通信経路の確立に失敗しました。ネットワーク接続を確認してください。',
    [ERROR_CATEGORY.CONNECTION_TIMEOUT]: '接続がタイムアウトしました。ネットワーク状況を確認して再試行してください。',
    [ERROR_CATEGORY.NETWORK]: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    [ERROR_CATEGORY.RATE_LIMIT]: 'リクエスト制限中です。しばらく待ってから再試行してください。',
    [ERROR_CATEGORY.SERVER_ERROR]: 'サーバーエラーが発生しました。時間をおいて再試行してください。',
    [ERROR_CATEGORY.UNKNOWN]: '予期しないエラーが発生しました。再試行してください。',
  },
  en: {
    [ERROR_CATEGORY.MIC_PERMISSION]: 'Microphone access denied. Please allow microphone access in browser settings.',
    [ERROR_CATEGORY.TOKEN_AUTH]: 'Authentication error. Please log in again.',
    [ERROR_CATEGORY.REALTIME_NEGOTIATE]: 'Failed to establish realtime connection. Please try again later.',
    [ERROR_CATEGORY.ICE_FAILED]: 'Failed to establish communication path. Please check your network.',
    [ERROR_CATEGORY.CONNECTION_TIMEOUT]: 'Connection timed out. Please check your network and try again.',
    [ERROR_CATEGORY.NETWORK]: 'Network error. Please check your internet connection.',
    [ERROR_CATEGORY.RATE_LIMIT]: 'Rate limited. Please wait and try again.',
    [ERROR_CATEGORY.SERVER_ERROR]: 'Server error. Please try again later.',
    [ERROR_CATEGORY.UNKNOWN]: 'Unexpected error. Please try again.',
  },
  'zh-Hans': {
    [ERROR_CATEGORY.MIC_PERMISSION]: '麦克风权限被拒绝。请在浏览器设置中允许麦克风访问。',
    [ERROR_CATEGORY.TOKEN_AUTH]: '认证错误。请重新登录。',
    [ERROR_CATEGORY.REALTIME_NEGOTIATE]: '无法建立实时连接。请稍后重试。',
    [ERROR_CATEGORY.ICE_FAILED]: '无法建立通信路径。请检查网络连接。',
    [ERROR_CATEGORY.CONNECTION_TIMEOUT]: '连接超时。请检查网络后重试。',
    [ERROR_CATEGORY.NETWORK]: '网络错误。请检查您的互联网连接。',
    [ERROR_CATEGORY.RATE_LIMIT]: '请求受限。请稍等后重试。',
    [ERROR_CATEGORY.SERVER_ERROR]: '服务器错误。请稍后重试。',
    [ERROR_CATEGORY.UNKNOWN]: '发生意外错误。请重试。',
  },
};

// 言語に応じたエラーメッセージを取得
const getErrorMessage = (category) => {
  const lang = getUiLang();
  return ERROR_MESSAGES[lang]?.[category] || ERROR_MESSAGES.ja[category] || ERROR_MESSAGES.ja[ERROR_CATEGORY.UNKNOWN];
};

const CONNECTION_TIMEOUT_MS = 10000; // 10秒でタイムアウト
const RETRY_BACKOFF_MS = 750; // リトライまでの待機時間（500ms〜1sの中間）
const MAX_RETRY_COUNT = 1; // リトライは1回のみ

// UUID生成（client_request_id 用）
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ========== Start Throttle / Rate Limit ==========
const START_THROTTLE_MS = 12000; // クライアント側スロットル: 12秒に1回まで（5回/分）
const DEFAULT_RATE_LIMIT_WAIT_MS = 60000; // 429時のデフォルト待機時間

// クールダウンタイマーをクリア
const clearCooldownTimer = () => {
  if (state.cooldownTimerId) {
    clearInterval(state.cooldownTimerId);
    state.cooldownTimerId = null;
  }
};

// クールダウン残り秒数を取得
const getCooldownRemainingSeconds = () => {
  const now = Date.now();
  if (state.cooldownUntil <= now) return 0;
  return Math.ceil((state.cooldownUntil - now) / 1000);
};

// クールダウンUIを更新（カウントダウン表示）
const updateCooldownDisplay = () => {
  const remainingSec = getCooldownRemainingSeconds();
  if (remainingSec <= 0) {
    // クールダウン終了
    clearCooldownTimer();
    state.cooldownUntil = 0;
    setError('');
    setStatus('Standby');
    if (els.start) els.start.disabled = false;
    addDiagLog('Cooldown ended, Start re-enabled');
    return;
  }
  setError(`あと${remainingSec}秒後に再試行できます`);
  setStatus('Cooldown');
};

// クールダウンを開始（waitMs ミリ秒間Startを無効化）
const startCooldown = (waitMs, reason = 'rate_limit') => {
  clearCooldownTimer();
  state.cooldownUntil = Date.now() + waitMs;
  const waitSec = Math.ceil(waitMs / 1000);
  addDiagLog(`Cooldown started | reason=${reason} | waitMs=${waitMs} | cooldownUntil=${state.cooldownUntil}`);

  // UIを即時更新
  if (els.start) els.start.disabled = true;
  if (els.stop) els.stop.disabled = true;
  setError(`あと${waitSec}秒後に再試行できます`);
  setStatus('Cooldown');

  // 1秒ごとにカウントダウン表示を更新
  state.cooldownTimerId = setInterval(() => {
    updateCooldownDisplay();
  }, 1000);
};

// クライアント側スロットルチェック
// returns: { allowed: boolean, waitMs: number }
const checkClientThrottle = () => {
  const now = Date.now();
  const elapsed = now - state.lastJobCreateAt;
  if (elapsed < START_THROTTLE_MS) {
    const waitMs = START_THROTTLE_MS - elapsed;
    return { allowed: false, waitMs };
  }
  return { allowed: true, waitMs: 0 };
};

// Classify error and return { category, message, retryable }
const classifyError = (err, context = '') => {
  const errMsg = (err?.message || String(err)).toLowerCase();
  const errName = (err?.name || '').toLowerCase();

  // マイク許可エラー
  if (errName === 'notallowederror' || errMsg.includes('permission denied') || errMsg.includes('not allowed')) {
    return { category: ERROR_CATEGORY.MIC_PERMISSION, message: getErrorMessage(ERROR_CATEGORY.MIC_PERMISSION), retryable: false };
  }

  // トークン認証エラー（/token 401, invalid_auth）
  if (context === 'token' || errMsg.includes('401') || errMsg.includes('invalid_auth') || errMsg.includes('token') && errMsg.includes('expired')) {
    return { category: ERROR_CATEGORY.TOKEN_AUTH, message: getErrorMessage(ERROR_CATEGORY.TOKEN_AUTH), retryable: false };
  }

  // 429 Rate Limit エラー
  if (errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('too many requests')) {
    return { category: ERROR_CATEGORY.RATE_LIMIT, message: getErrorMessage(ERROR_CATEGORY.RATE_LIMIT), retryable: false };
  }

  // 5xx サーバーエラー
  if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503') || errMsg.includes('504') || errMsg.includes('server error')) {
    return { category: ERROR_CATEGORY.SERVER_ERROR, message: getErrorMessage(ERROR_CATEGORY.SERVER_ERROR), retryable: true };
  }

  // Realtime negotiate エラー（400, 401）
  if (context === 'negotiate' || errMsg.includes('negotiate') || errMsg.includes('realtime')) {
    if (errMsg.includes('401') || errMsg.includes('unauthorized')) {
      return { category: ERROR_CATEGORY.TOKEN_AUTH, message: getErrorMessage(ERROR_CATEGORY.TOKEN_AUTH), retryable: false };
    }
    return { category: ERROR_CATEGORY.REALTIME_NEGOTIATE, message: getErrorMessage(ERROR_CATEGORY.REALTIME_NEGOTIATE), retryable: true };
  }

  // ICE接続失敗
  if (errMsg.includes('ice') || errMsg.includes('connection failed') || errMsg.includes('ice failed')) {
    return { category: ERROR_CATEGORY.ICE_FAILED, message: getErrorMessage(ERROR_CATEGORY.ICE_FAILED), retryable: true };
  }

  // タイムアウト
  if (errMsg.includes('timeout') || errMsg.includes('timed out')) {
    return { category: ERROR_CATEGORY.CONNECTION_TIMEOUT, message: getErrorMessage(ERROR_CATEGORY.CONNECTION_TIMEOUT), retryable: true };
  }

  // ネットワークエラー
  if (errMsg.includes('network') || errMsg.includes('fetch') || errName === 'typeerror') {
    return { category: ERROR_CATEGORY.NETWORK, message: getErrorMessage(ERROR_CATEGORY.NETWORK), retryable: true };
  }

  return { category: ERROR_CATEGORY.UNKNOWN, message: getErrorMessage(ERROR_CATEGORY.UNKNOWN), retryable: true };
};

const hasQuotaForStart = () => {
  const quota = state.quota;
  if (!quota.loaded) {
    setError('利用可能時間の確認に失敗しました。しばらくしてから再試行してください。');
    addDiagLog('Start blocked: quota not loaded');
    return false;
  }
  // Use blockedReason from API if available
  if (quota.blockedReason) {
    const msg = blockedReasonMessages[quota.blockedReason] || '利用がブロックされています。';
    setError(msg);
    addDiagLog(`Start blocked: ${quota.blockedReason}`);
    return false;
  }
  // Fallback checks (in case API doesn't return blockedReason)
  if (typeof quota.totalAvailableThisMonth === 'number' && quota.totalAvailableThisMonth <= 0) {
    setError('今月の利用可能時間が残っていません。');
    addDiagLog('Start blocked: monthly quota exhausted');
    return false;
  }
  if (quota.plan === 'free' && typeof quota.dailyRemainingSeconds === 'number' && quota.dailyRemainingSeconds <= 0) {
    setError('Freeプランの本日の利用上限(10分)に達しました。');
    addDiagLog('Start blocked: daily limit reached');
    return false;
  }
  return true;
};

const reserveJobSlot = async ({ forceTakeover = false } = {}) => {
  // ========== 二重呼び出し防止: すでにジョブがある場合は呼ばない ==========
  if (state.currentJob || state.jobActive) {
    addDiagLog(`reserveJobSlot skipped: job already active | jobId=${state.currentJob?.jobId} | jobActive=${state.jobActive}`);
    return state.currentJob;
  }

  // client_request_id を生成（観測用）
  const clientRequestId = generateUUID();
  addDiagLog(`[job] Requesting reservation | clientRequestId=${clientRequestId}`);

  // 呼び出し時刻を記録（スロットル用）
  state.lastJobCreateAt = Date.now();

  const createUrl = forceTakeover
    ? '/api/v1/jobs/create?force_takeover=true'
    : '/api/v1/jobs/create';
  const res = await authFetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientRequestId }),
  });
  const data = await res.json().catch(() => ({}));

  // 409 active_job_in_progress の処理（複数形式対応）
  const detail = data?.detail;
  const errorCode = (typeof detail === 'string' ? detail : detail?.error) || data?.error;
  if (res.status === 409 && errorCode === 'active_job_in_progress') {
    // 409 detail から activeSince を取得
    const activeSince = (typeof detail === 'object' && detail?.activeSince) ? detail.activeSince : null;
    addDiagLog(`[job] Blocked: active_job_in_progress | clientRequestId=${clientRequestId} | activeSince=${activeSince}`);

    // B案: takeover ダイアログを表示（閉じるのみ）して必ず中断
    await showTakeoverDialog(activeSince);
    const abortErr = new Error('active_job_in_progress');
    abortErr._context = 'job_create';
    abortErr._abortStart = true;
    throw abortErr;
  }

  // 429 Too Many Requests の処理 (quota制限含む)
  if (res.status === 429) {
    const errorCode = data?.detail || 'rate_limited';
    addDiagLog(`429 | errorCode=${errorCode} | clientRequestId=${clientRequestId}`);

    // quota関連のエラーはブロック理由メッセージを表示
    if (blockedReasonMessages[errorCode]) {
      const quotaErr = new Error(blockedReasonMessages[errorCode]);
      quotaErr._isQuotaLimit = true;
      quotaErr._errorCode = errorCode;
      throw quotaErr;
    }

    // レート制限の場合はクールダウン処理
    const retryAfterHeader = res.headers.get('Retry-After');
    let waitMs = DEFAULT_RATE_LIMIT_WAIT_MS;
    if (retryAfterHeader) {
      const retryAfterSec = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfterSec) && retryAfterSec > 0) {
        waitMs = retryAfterSec * 1000;
      }
    }

    const rateLimitErr = new Error('rate_limit');
    rateLimitErr._isRateLimit = true;
    rateLimitErr._waitMs = waitMs;
    throw rateLimitErr;
  }

  if (!res.ok) {
    const message = extractErrorMessage(data, 'ジョブの予約に失敗しました。');
    throw new Error(message);
  }

  // reused=true の場合は復帰フロー
  const reused = data.reused === true;
  if (reused) {
    addDiagLog(`Job reused (idempotent recovery) | jobId=${data.jobId} | clientRequestId=${clientRequestId}`);
  }

  state.currentJob = {
    jobId: data.jobId,
    reservedSeconds: data.reservedSeconds,
    reservedBaseSeconds: data.reservedBaseSeconds,
    reservedTicketSeconds: data.reservedTicketSeconds,
  };
  state.jobStartedAt = Date.now();
  state.jobActive = true; // ジョブ有効化
  applyQuotaFromPayload(data);
  addDiagLog(`Job reserved | jobId=${data.jobId} | reused=${reused} | jobActive=true | clientRequestId=${clientRequestId}`);
  return data;
};

const getJobElapsedSeconds = () => {
  if (!state.jobStartedAt) return null;
  return Math.max(0, Math.round((Date.now() - state.jobStartedAt) / 1000));
};

const completeCurrentJob = async (audioSeconds) => {
  if (!state.currentJob) {
    addDiagLog('completeCurrentJob: no active job to complete');
    return null;
  }
  if (!state.jobActive) {
    addDiagLog('completeCurrentJob: job already marked inactive, skipping');
    return null;
  }
  const payload = { jobId: state.currentJob.jobId };
  if (typeof audioSeconds === 'number' && Number.isFinite(audioSeconds)) {
    payload.audioSeconds = Math.max(0, Math.round(audioSeconds));
  }
  try {
    const res = await authFetch('/api/v1/jobs/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = extractErrorMessage(data, 'ジョブの完了に失敗しました。');
      throw new Error(message);
    }
    applyQuotaFromPayload(data);
    addDiagLog(`Job completed | billed=${data.billedSeconds ?? 'n/a'}s | jobActive=false`);
    return data;
  } catch (err) {
    addDiagLog(`Job completion failed: ${err.message || err}`);
    return null;
  } finally {
    state.currentJob = null;
    state.jobStartedAt = null;
    state.jobActive = false; // ジョブ無効化
  }
};

const trimTail = (text, limit) => {
  if (!limit || text.length <= limit) return text;
  return '…' + text.slice(text.length - limit);
};

const appendDownload = (label, url) => {
  if (!els.downloads) return;
  const link = document.createElement('a');
  link.href = url;
  link.textContent = label;
  link.download = '';
  els.downloads.appendChild(link);
};

const resetDownloads = () => {
  if (!els.downloads) return;
  els.downloads.innerHTML = '';
};

const updateLiveText = () => {
  if (!els.liveTranscript) return;
  els.liveTranscript.textContent = state.liveOriginal || '・・・';
};

const LOG_MAX_ENTRIES = 500;

const addLogEntry = (container, text, className = '') => {
  if (!container || !text) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (className ? ' ' + className : '');
  entry.textContent = text;
  container.prepend(entry);
  // 上限を超えたら古いエントリを削除
  while (container.children.length > LOG_MAX_ENTRIES) {
    container.lastChild.remove();
  }
};

const addTranscriptLog = (text) => {
  addLogEntry(els.transcriptLog, text);
};

const addTranslationLog = (text) => {
  addLogEntry(els.translationLog, text, 'translation');
};

const clearLogs = () => {
  if (els.transcriptLog) els.transcriptLog.innerHTML = '';
  if (els.translationLog) els.translationLog.innerHTML = '';
};

const stopMedia = () => {
  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach((t) => t.stop());
    state.mediaStream = null;
  }
  if (state.recorder && state.recorder.state !== 'inactive') {
    state.recorder.stop();
  }
  state.recorder = null;
};

const closeRtc = () => {
  if (state.dataChannel) {
    try {
      state.dataChannel.onmessage = null;
      state.dataChannel.onclose = null;
      state.dataChannel.onerror = null;
      state.dataChannel.close();
    } catch (e) {
      // ignore close errors
    }
  }
  if (state.pc) {
    try {
      // イベントハンドラを解除して残骸を防ぐ
      state.pc.oniceconnectionstatechange = null;
      state.pc.onicegatheringstatechange = null;
      state.pc.onconnectionstatechange = null;
      state.pc.onicecandidate = null;
      state.pc.ontrack = null;
      state.pc.getSenders().forEach((s) => s.track && s.track.stop());
      state.pc.close();
    } catch (e) {
      // ignore close errors
    }
  }
  state.pc = null;
  state.dataChannel = null;
  addDiagLog('closeRtc: cleanup completed');
};

const startRecorder = (stream) => {
  state.recordingChunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) state.recordingChunks.push(e.data);
  };
  recorder.start(200);
  state.recorder = recorder;
};

const uploadForM4A = async (blob) => {
  const fd = new FormData();
  fd.append('file', blob, 'audio.webm');
  const res = await authFetch('/audio_m4a', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('m4a変換失敗');
  const data = await res.json();
  appendDownload('m4a', data.url);
};

// Returns the M4A URL for storage in history
const uploadForM4AAndGetUrl = async (blob) => {
  const fd = new FormData();
  fd.append('file', blob, 'audio.webm');
  const res = await authFetch('/audio_m4a', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('m4a変換失敗');
  const data = await res.json();
  appendDownload('m4a', data.url);
  return data.url;
};

const saveTextDownloads = async () => {
  const originals = state.logs.join('\n');
  const bilingual = state.logs
    .map((orig, idx) => `${orig}\n${state.translations[idx] || ''}`)
    .join('\n\n');

  let summaryMd = '';
  if (originals.trim()) {
    const fd = new FormData();
    fd.append('text', originals);
    fd.append('output_lang', state.outputLang);
    if (state.glossaryText) {
      fd.append('glossary_text', state.glossaryText);
    }
    if (state.summaryPrompt) {
      fd.append('summary_prompt', state.summaryPrompt);
    }
    const summaryRes = await authFetch('/summarize', {
      method: 'POST',
      body: fd,
    });
    if (summaryRes.ok) {
      const data = await summaryRes.json();
      summaryMd = data.summary || '';
    }
  }

  const makeBlobLink = (label, content, type = 'text/plain') => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    appendDownload(label, url);
  };

  makeBlobLink('原文.txt', originals);
  makeBlobLink('原文+日本語.txt', bilingual);
  if (summaryMd) makeBlobLink('要約.md', summaryMd, 'text/markdown');

  // Show summary section for manual summary generation
  if (originals.trim() && els.summarySection) {
    els.summarySection.style.display = 'block';
    if (els.runSummary) els.runSummary.disabled = false;
  }
};

// Enhanced version that also shows result card UI
const saveTextDownloadsWithResultCard = async () => {
  const originals = state.logs.join('\n');
  const bilingual = state.logs
    .map((orig, idx) => `${orig}\n${state.translations[idx] || ''}`)
    .join('\n\n');

  // Attempt auto-summary (non-blocking on failure)
  let summaryMd = '';
  if (originals.trim()) {
    // Validate inputs before sending to /summarize
    const validation = validateSummarizeInputs(
      bilingual || originals,
      state.glossaryText,
      state.summaryPrompt
    );

    if (!validation.valid) {
      addDiagLog(`Auto-summary blocked: ${validation.errors.join(', ')}`);
      // Don't send to server, but continue with rest of flow
    } else {
      try {
        const fd = new FormData();
        fd.append('text', validation.text);
        fd.append('output_lang', state.outputLang);
        if (validation.glossaryText) {
          fd.append('glossary_text', validation.glossaryText);
        }
        if (validation.summaryPrompt) {
          fd.append('summary_prompt', validation.summaryPrompt);
        }
        const summaryRes = await authFetch('/summarize', {
          method: 'POST',
          body: fd,
        });
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          summaryMd = data.summary || '';
          if (state.currentSessionResult) {
            state.currentSessionResult.summary = summaryMd;
          }
        }
      } catch (err) {
        addDiagLog(`Auto-summary failed: ${err.message}`);
      }
    }
  }

  // Show result card UI (replaces legacy downloads and summary section)
  showResultCard(summaryMd);
};

// Show result card after stop
const showResultCard = (summaryMd = '') => {
  if (!els.resultCard) return;

  const session = state.currentSessionResult;
  if (!session) return;

  // Hide legacy downloads and summary section (replaced by result card)
  if (els.downloads) {
    els.downloads.innerHTML = '';
    els.downloads.style.display = 'none';
  }
  if (els.summarySection) {
    els.summarySection.style.display = 'none';
  }

  // Set title and timestamp
  if (els.resultCardTitle) {
    els.resultCardTitle.textContent = session.title || 'セッション結果';
  }
  if (els.resultCardTimestamp) {
    els.resultCardTimestamp.textContent = formatTimestamp(session.timestamp);
  }

  // Build file download buttons
  if (els.resultCardFiles) {
    els.resultCardFiles.innerHTML = '';
    const files = [];
    const tsFilename = formatTimestampForFilename(session.timestamp);

    // Audio files
    if (session.audioUrl) {
      files.push({ label: '🎤 WebM', url: session.audioUrl, download: `${tsFilename}.webm` });
    }
    if (session.m4aUrl) {
      files.push({ label: '🎵 M4A', url: session.m4aUrl, download: `${tsFilename}.m4a` });
    }

    // Text files (create blob URLs and track for cleanup)
    if (session.originals.length > 0) {
      const originalsText = session.originals.join('\n');
      const originalsUrl = URL.createObjectURL(new Blob([originalsText], { type: 'text/plain' }));
      state.objectUrls.push(originalsUrl);
      files.push({ label: '📝 原文', url: originalsUrl, download: `原文_${tsFilename}.txt` });

      const bilingualText = session.originals
        .map((orig, idx) => `${orig}\n${session.translations[idx] || ''}`)
        .join('\n\n');
      const bilingualUrl = URL.createObjectURL(new Blob([bilingualText], { type: 'text/plain' }));
      state.objectUrls.push(bilingualUrl);
      files.push({ label: '🌐 原文+翻訳', url: bilingualUrl, download: `原文+翻訳_${tsFilename}.txt` });
    }

    // Summary file (if exists)
    if (summaryMd) {
      const summaryUrl = URL.createObjectURL(new Blob([summaryMd], { type: 'text/markdown' }));
      state.objectUrls.push(summaryUrl);
      files.push({ label: '📋 要約', url: summaryUrl, download: `要約_${tsFilename}.md` });
    }

    files.forEach((file) => {
      const btn = document.createElement('a');
      btn.href = file.url;
      btn.download = file.download;
      btn.className = 'result-file-btn';
      btn.textContent = file.label;
      els.resultCardFiles.appendChild(btn);
    });
  }

  // Show summary output
  if (els.summaryOutputCard) {
    els.summaryOutputCard.textContent = summaryMd || '';
  }
  if (els.copySummaryCard) {
    els.copySummaryCard.style.display = summaryMd ? 'inline-block' : 'none';
  }

  // Update summary button text
  if (els.runSummaryCard) {
    els.runSummaryCard.textContent = summaryMd ? '要約を再生成' : '要約を生成';
    els.runSummaryCard.disabled = false;
  }

  // Show the card
  els.resultCard.style.display = 'block';
};

// Hide result card (called on start)
const hideResultCard = () => {
  if (els.resultCard) {
    els.resultCard.style.display = 'none';
  }
  // Revoke temporary blob URLs to free memory
  if (state.objectUrls && state.objectUrls.length > 0) {
    state.objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore revoke errors
      }
    });
    state.objectUrls = [];
  }
  state.currentSessionResult = null;
};

const translateCompleted = async (text) => {
  try {
    const fd = new FormData();
    fd.append('text', text);
    fd.append('input_lang', state.inputLang);
    fd.append('output_lang', state.outputLang);
    const res = await authFetch('/translate', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(t('errorTranslation'));
    const data = await res.json();
    const translation = data.translation || '';
    state.translations.push(translation);
    addTranslationLog(translation);
  } catch (err) {
    setError(err.message);
  }
};

const commitLog = (text, itemId = null) => {
  if (!text || !text.trim()) return;
  state.logs.push(text);
  addTranscriptLog(text);
  translateCompleted(text);
  state.liveOriginal = '';
  if (itemId) {
    state.committedItems.add(itemId);
  }
  setError('');
};

const clearGapTimer = () => {
  if (state.gapTimer) {
    clearTimeout(state.gapTimer);
    state.gapTimer = null;
  }
};

const commitActiveOnGap = () => {
  const itemId = state.activeItemId;
  const buffered = itemId ? state.partialByItem.get(itemId) : '';
  const text = buffered || state.liveOriginal;
  if (!text) return;
  commitLog(text, itemId || undefined);
  if (itemId) {
    state.partialByItem.delete(itemId);
  }
  state.activeItemId = null;
  state.liveOriginal = '';
  updateLiveText();
};

const resetGapTimer = () => {
  clearGapTimer();
  state.gapTimer = setTimeout(() => {
    commitActiveOnGap();
  }, state.gapMs);
};

const handleDelta = (payload) => {
  const itemId = payload.item_id || state.activeItemId || 'default';
  const delta = payload.delta ?? payload.text ?? payload.transcript ?? '';
  const existing = state.partialByItem.get(itemId) || '';
  const updated = existing + delta;
  state.partialByItem.set(itemId, updated);
  state.activeItemId = itemId;
  state.liveOriginal = updated;
  updateLiveText();
  resetGapTimer();
};

const handleCompleted = (payload) => {
  const itemId = payload.item_id || state.activeItemId || 'default';
  const buffered = state.partialByItem.get(itemId) || '';
  const text =
    payload.transcript || payload.text || payload.content?.[0]?.transcript || buffered;

  if (!text) {
    state.partialByItem.delete(itemId);
    return;
  }

  if (state.committedItems.has(itemId)) {
    state.partialByItem.delete(itemId);
    if (state.activeItemId === itemId) {
      state.liveOriginal = '';
      state.activeItemId = null;
      updateLiveText();
    }
    return;
  }

  commitLog(text, itemId);
  state.partialByItem.delete(itemId);
  if (state.activeItemId === itemId) {
    state.activeItemId = null;
    state.liveOriginal = '';
  }
  updateLiveText();
  clearGapTimer();
};

const handleDataMessage = (event) => {
  const raw = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
  addRawRealtimeEvent(raw);
  try {
    const msg = JSON.parse(event.data);
    const type = msg.type || msg.event || '';

    // エラーイベントの完全ログ出力（原因特定用・session context含む）
    if (msg?.type === 'error' || type === 'error' || msg.error) {
      const errInfo = msg.error || msg;
      const errType = errInfo.type || 'unknown_type';
      const errCode = errInfo.code || 'unknown_code';
      const errParam = errInfo.param || '';
      const errMessage = errInfo.message || msg.message || 'Realtime error';
      console.error('[realtime:error] Full error payload:', JSON.stringify(msg, null, 2));
      console.error(`[realtime:error] code=${errCode}, type=${errType}, param=${errParam}, message=${errMessage}`);
      addDiagLog(`REALTIME_ERROR | sid=${state.sessionId || 'no_sid'} type=${errType} code=${errCode} param=${errParam} msg=${errMessage}`);
      addDiagLog(`REALTIME_ERROR_JSON: ${JSON.stringify(msg)}`);
      setError(errMessage);
      return;
    }

    if (type === 'conversation.item.input_audio_transcription.delta') {
      handleDelta(msg);
    } else if (type === 'conversation.item.input_audio_transcription.completed') {
      handleCompleted(msg);
    }
  } catch (err) {
    console.error('[realtime:parse] message parse error:', err);
    addDiagLog(`REALTIME_PARSE_ERROR | sid=${state.sessionId || 'no_sid'} error=${err.message}`);
  }
};

const fetchToken = async () => {
  const fd = new FormData();
  fd.append('vad_silence', String(state.vadSilence || 400));
  fd.append('glossaryText', state.glossaryText || '');
  fd.append('outputLang', state.outputLang || 'auto');
  let res;
  let statusLogged = false;

  try {
    res = await authFetch('/token', { method: 'POST', body: fd });
    addDiagLog(`STEP4: token fetch response status=${res.status}`);
    statusLogged = true;

    if (!res.ok) {
      const errorBody = await res.text();
      const err = new Error(`/token ${res.status}: ${errorBody || res.statusText}`);
      err._context = 'token';
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    const clientSecret = data.value || data.client_secret || data.clientSecret;
    if (!clientSecret) {
      const err = new Error('client_secret missing in /token response');
      err._context = 'token';
      throw err;
    }
    return clientSecret;
  } catch (err) {
    err._context = err._context || 'token';
    logErrorDetails('fetchToken', err);
    throw err;
  } finally {
    if (!statusLogged) {
      addDiagLog('STEP4: token fetch response status=no_response');
    }
  }
};

  const negotiate = async (clientSecret) => {
  // Generate session ID for diagnostics
  state.sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  addDiagLog(`Session started: sid=${state.sessionId} build=${state.buildVersion || 'unknown'}`);

  const pc = new RTCPeerConnection();
  state.pc = pc;

  pc.onconnectionstatechange = () => {
    addDiagLog(`[rtc] connectionState: ${pc.connectionState}`);
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      handleNetworkDisconnectOnce(`pc:${pc.connectionState}`);
    }
    if (pc.connectionState === 'connected') {
      resetDisconnectState();
    }
  };

  pc.oniceconnectionstatechange = () => {
    addDiagLog(`[rtc] iceConnectionState: ${pc.iceConnectionState}`);
  };

  state.dataChannel = pc.createDataChannel('oai-events');
  state.dataChannel.onmessage = handleDataMessage;
  state.dataChannel.onclose = () => {
    addDiagLog('[rtc] DataChannel closed');
    handleNetworkDisconnectOnce('datachannel:close');
  };
  state.dataChannel.onopen = () => {
    addDiagLog('[rtc] STEP7: RTC connected / datachannel opened');
    setStatus('Listening');
    flushRealtimeEventQueue();
    try {
      sendSessionUpdate();
    } catch (err) {
      logErrorDetails('session.update', err);
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  state.mediaStream = stream;
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  startRecorder(stream);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const checkState = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', checkState);
  });

  const offerSdp = pc.localDescription.sdp;

  addDiagLog(`STEP5: before negotiate | offerSdpLen=${offerSdp?.length || 0}`);

  // デバッグ: SDP offer の検証
  console.log('[negotiate] Realtime URL:', REALTIME_CALLS_URL);
  console.log('[negotiate] clientSecret prefix:', clientSecret ? `${clientSecret.substring(0, 10)}...` : 'missing');
  console.log('[negotiate] Offer SDP length:', offerSdp.length);
  if (!offerSdp.includes('v=0')) console.warn('[negotiate] SDP missing v=0');
  if (!offerSdp.includes('m=audio')) console.warn('[negotiate] SDP missing m=audio');
  if (!offerSdp.includes('a=ice-ufrag')) console.warn('[negotiate] SDP missing a=ice-ufrag');
  if (!offerSdp.includes('a=ice-pwd')) console.warn('[negotiate] SDP missing a=ice-pwd');

  // OpenAI Realtime API (ephemeral flow): Content-Type: application/sdp, body: raw SDP
  let res;
  let responseLogged = false;
  try {
    res = await fetch(REALTIME_CALLS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp',
      },
      body: offerSdp,
    });

    console.log('[negotiate] Response status:', res.status);
    console.log('[negotiate] Response Location header:', res.headers.get('Location'));
    addDiagLog(`STEP6: negotiate response status=${res.status}`);
    responseLogged = true;

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[negotiate] OpenAI realtime/calls FAILED');
      console.error('[negotiate] Status:', res.status);
      console.error('[negotiate] Response headers:', [...res.headers.entries()]);
      console.error('[negotiate] Response body:', errorBody);
      const err = new Error(`Realtime negotiate failed (${res.status}): ${errorBody || res.statusText}`);
      err._context = 'negotiate';
      throw err;
    }

    const answerSdp = await res.text();
    console.log('[negotiate] Answer SDP length:', answerSdp.length);
    console.log('[negotiate] Answer SDP starts with v=0:', answerSdp.startsWith('v=0'));
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    console.log('[negotiate] setRemoteDescription completed');
    setStatus('Connecting');
  } catch (err) {
    err._context = err._context || 'negotiate';
    logErrorDetails('negotiate', err);
    throw err;
  } finally {
    if (!responseLogged) {
      addDiagLog('STEP6: negotiate response status=no_response');
    }
  }
};

const startConnectionAttempt = async () => {
  addDiagLog('STEP3: before token fetch');
  try {
    const clientSecret = await fetchToken();
    await negotiate(clientSecret);
  } catch (err) {
    logErrorDetails('startConnectionAttempt', err);
    throw err;
  }
};

const start = async () => {
  addDiagLog('STEP1: start() entered');

  // ========== 二重発火防止: in-flight ガード ==========
  if (state.startInFlight) {
    addDiagLog('Start blocked: already in-flight (double-fire prevention)');
    return;
  }
  state.startInFlight = true;
  addDiagLog('Start requested | startInFlight=true');

  try {
    // Hide previous result card when starting new session
    hideResultCard();

    if (!firebaseState.initialized) {
      setError('Firebase初期化に失敗しました。設定を確認してください。');
      addDiagLog('Start blocked: Firebase not ready');
      return;
    }
    if (!currentUser) {
      setError('ログインが必要です');
      addDiagLog('Start blocked: user not authenticated');
      return;
    }

    // クールダウン中かチェック
    if (getCooldownRemainingSeconds() > 0) {
      addDiagLog('Start blocked: cooldown active');
      return; // クールダウンタイマーがUIを更新中なのでここでは何もしない
    }

    // クライアント側スロットルチェック（12秒に1回）
    const throttle = checkClientThrottle();
    if (!throttle.allowed) {
      const waitSec = Math.ceil(throttle.waitMs / 1000);
      addDiagLog(`Start throttled (client) | waitMs=${throttle.waitMs}`);
      startCooldown(throttle.waitMs, 'client_throttle');
      return;
    }

    if (!state.quota.loaded) {
      await refreshQuotaStatus();
    }
    if (!hasQuotaForStart()) {
      els.start.disabled = false;
      els.stop.disabled = true;
      return;
    }

    // Update UI state
    els.start.disabled = true;
    els.stop.disabled = false;
  clearGapTimer();
  resetDownloads();
  clearLogs();
  state.logs = [];
  state.translations = [];
  state.liveOriginal = '';
  state.partialByItem = new Map();
  state.committedItems = new Set();
  state.activeItemId = null;
  state.realtimeEventQueue = []; // Clear any stale queued events
  state.sttSettings.wsAppliedOnce = false; // Reset STT settings applied flag for new connection
  updateLiveText();
  setError('');

  let retryCount = 0;
  let lastError = null;

  while (retryCount <= MAX_RETRY_COUNT) {
    try {
      // Reserve job slot only once (before first attempt)
      // state.jobActiveはreserveJobSlot内でtrueに設定される
      if (!state.jobActive) {
        await reserveJobSlot();
        addDiagLog('STEP2: after reserveJobSlot success');
      }

      await startConnectionAttempt();
      return; // Success - exit the retry loop (finally will reset startInFlight)

    } catch (err) {
      logErrorDetails('start', err);
      if (err._abortStart) {
        addDiagLog('Start aborted by user (takeover declined)');
        stopMedia();
        closeRtc();
        setStatus('Standby');
        els.start.disabled = false;
        els.stop.disabled = true;
        return;
      }
      // 429 Rate Limit エラーの特別処理
      if (err._isRateLimit) {
        addDiagLog(`Start blocked: 429 rate limit | waitMs=${err._waitMs}`);
        stopMedia();
        closeRtc();
        startCooldown(err._waitMs, '429_rate_limit');
        return; // クールダウン中なのでここで終了
      }

      lastError = err;
      const context = err._context || '';
      const classified = classifyError(err, context);

      addDiagLog(`Start attempt ${retryCount + 1} failed: [${classified.category}] ${err.message}`);

      // Clean up current attempt
      stopMedia();
      closeRtc();

      // Check if error is retryable
      if (!classified.retryable) {
        addDiagLog(`Error not retryable: ${classified.category}`);
        break;
      }

      // Check if we have retries left
      if (retryCount >= MAX_RETRY_COUNT) {
        addDiagLog('Max retries reached');
        break;
      }

      // Wait before retry
      retryCount++;
      addDiagLog(`Retrying in ${RETRY_BACKOFF_MS}ms (attempt ${retryCount + 1}/${MAX_RETRY_COUNT + 1})`);
      setStatus('Retrying...');
      await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
    }
  }

  // All attempts failed - show classified error message
  const finalClassified = classifyError(lastError, lastError?._context || '');
  setError(finalClassified.message);
  addDiagLog(`Start failed permanently: [${finalClassified.category}] ${finalClassified.message}`);

  els.start.disabled = false;
  els.stop.disabled = true;
  stopMedia();
  closeRtc();

  // jobActiveがtrueならジョブを0秒で完了させる（失敗時の後始末）
  if (state.jobActive) {
    addDiagLog(`COMPLETE because start failed: ${finalClassified.category}`);
    await completeCurrentJob(0);
  }
  } finally {
    // ========== in-flight ガード解除 ==========
    state.startInFlight = false;
    addDiagLog('start() exiting | startInFlight=false');
  }
};

const stop = async () => {
  addDiagLog(`Stop requested | jobActive=${state.jobActive}`);
  els.start.disabled = false;
  els.stop.disabled = true;
  clearGapTimer();
  stopMedia();
  closeRtc();
  setStatus('Standby');

  // Initialize session result for this stop
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sessionTimestamp = Date.now();
  state.currentSessionResult = {
    id: sessionId,
    timestamp: sessionTimestamp,
    title: '',
    originals: [...state.logs],
    translations: [...state.translations],
    summary: '',
    audioUrl: null,
    m4aUrl: null,
    durationSeconds: null,
    serverTimestampMs: null,
    inputLang: state.inputLang,
    outputLang: state.outputLang,
  };

  if (state.recorder) {
    state.recorder.stop();
  }
  if (state.recordingChunks.length) {
    const blob = new Blob(state.recordingChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    state.currentSessionResult.audioUrl = url;
    appendDownload('webm', url);
    try {
      const m4aUrl = await uploadForM4AAndGetUrl(blob);
      state.currentSessionResult.m4aUrl = m4aUrl;
    } catch (err) {
      setError(err.message);
      addDiagLog(`M4A conversion failed: ${err.message}`);
    }
  }

  let completionData = null;
  let elapsedSeconds = null;

  // jobActiveがtrueの場合のみジョブを完了させる
  if (state.jobActive) {
    elapsedSeconds = getJobElapsedSeconds();
    completionData = await completeCurrentJob(elapsedSeconds);
  } else {
    addDiagLog('Stop: no active job to complete');
  }

  if (completionData && typeof completionData.actualSeconds === 'number') {
    state.currentSessionResult.durationSeconds = completionData.actualSeconds;
  } else if (typeof elapsedSeconds === 'number') {
    state.currentSessionResult.durationSeconds = elapsedSeconds;
  }

  if (completionData?.serverTime) {
    const serverMs = parseServerTimeMs(completionData.serverTime);
    if (serverMs != null) {
      state.currentSessionResult.serverTimestampMs = serverMs;
    }
  }

  // Generate title from text (try LLM, fallback to simple extraction)
  const titleSource = state.currentSessionResult.translations.join(' ') || state.currentSessionResult.originals.join(' ');
  const llmTitle = await generateSessionTitleWithFallback(titleSource);
  state.currentSessionResult.title = llmTitle || formatTimestampForFilename(sessionTimestamp);

  // Save text downloads and attempt auto-summary
  await saveTextDownloadsWithResultCard();

  // Save to history (even if incomplete)
  try {
    await historyStorage.save(state.currentSessionResult);
    addDiagLog(`History saved: ${sessionId}`);
  } catch (err) {
    addDiagLog(`History save failed: ${err.message}`);
  }

  addDiagLog('Stop completed');
};

const applyAuthUiState = (user) => {
  if (!els.loginBtn || !els.logoutBtn || !els.start || !els.userEmail) return;
  if (user) {
    els.userEmail.textContent = user.email || '';
    els.loginBtn.style.display = 'none';
    els.logoutBtn.style.display = '';
    els.start.disabled = false;
  } else {
    els.userEmail.textContent = '';
    els.loginBtn.style.display = '';
    els.logoutBtn.style.display = 'none';
    els.start.disabled = firebaseState.initialized;
    resetQuotaState();
  }
  updateDevStatusSummary();
};

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // APP INITIALIZATION - Structured for Resilience
  // ============================================================
  // initCritical(): Core functionality - login, main UI, auth
  //   - Failures are logged but should not crash the app
  // initNonCritical(): Optional features - SW, BUILD display, diagnostics
  //   - Failures are silently caught and do not affect core functionality
  // ============================================================

  // ============================================================
  // HOISTED FUNCTION DECLARATIONS (TDZ-safe)
  // These MUST use `function` keyword (not const/let) to ensure hoisting.
  // See docs/dev-guardrails.md for the full policy.
  // ============================================================

  // SW Update Notification: Show banner and register update button
  function showUpdateBanner(worker) {
    if (!els.swUpdateBanner || !els.swUpdateBtn) return;

    els.swUpdateBanner.style.display = 'flex';

    // Remove previous listeners to avoid duplicates
    const newBtn = els.swUpdateBtn.cloneNode(true);
    els.swUpdateBtn.replaceWith(newBtn);
    els.swUpdateBtn = newBtn;

    els.swUpdateBtn.addEventListener('click', () => {
      console.log('[SW] User clicked update, sending SKIP_WAITING');
      worker.postMessage({ type: 'SKIP_WAITING' });
      els.swUpdateBanner.style.display = 'none';
    });
  }

  // Fetch and display BUILD_SHA from /build.txt
  async function fetchBuildSha() {
    try {
      const response = await fetch('/build.txt', { cache: 'no-cache' });
      if (!response.ok) throw new Error('build.txt not found');
      const text = await response.text();
      const shaMatch = text.match(/BUILD_SHA=([^\s]+)/);
      const timeMatch = text.match(/BUILD_TIME_UTC=([^\s]+)/);
      const sha = shaMatch ? shaMatch[1] : 'unknown';
      const time = timeMatch ? timeMatch[1] : '';
      // Store in state for diagnostics
      state.buildVersion = sha;
      if (els.buildShaDisplay) {
        els.buildShaDisplay.textContent = `BUILD_SHA: ${sha}${time ? ' (' + time + ')' : ''}`;
      }
    } catch (err) {
      console.warn('[BUILD] Failed to fetch build.txt:', err);
      state.buildVersion = 'fetch_failed';
      if (els.buildShaDisplay) {
        els.buildShaDisplay.textContent = 'BUILD_SHA: 取得失敗';
      }
    }
  }

  // ============================================================
  // CRITICAL PATH - Core initialization
  // Failures here are logged and shown, but we try to continue
  // ============================================================
  function initCritical() {
    addDiagLog('DOM ready');
    cacheElements();
    scrubDebugArtifacts();

    // Initialize form values from state
    if (els.maxChars) els.maxChars.value = state.maxChars;
    if (els.gapMs) els.gapMs.value = state.gapMs;
    if (els.vadSilence) els.vadSilence.value = state.vadSilence;
    if (els.uiLang) els.uiLang.value = state.uiLang;
    if (els.inputLang) els.inputLang.value = state.inputLang;
    if (els.outputLang) els.outputLang.value = state.outputLang;
    if (els.glossaryTextInput) els.glossaryTextInput.value = state.glossaryText;
    if (els.summaryPromptInput) els.summaryPromptInput.value = state.summaryPrompt;

    applyI18n();

    // ---- CRITICAL EVENT HANDLERS (login, main buttons) ----
    // 二重登録防止: state.uiBound でガード
    if (!state.uiBound) {
      if (els.start) els.start.addEventListener('click', start);
      if (els.stop) els.stop.addEventListener('click', stop);
      state.uiBound = true;
      addDiagLog('UI event handlers bound (start/stop)');
    } else {
      addDiagLog('UI event handlers already bound, skipping');
    }

    // Firebase initialization and auth
    initFirebase();
    applyAuthUiState(null);
    addDiagLog(`Auth init: currentUser=${currentUser?.uid || 'null'}`);

    // Login button - CRITICAL
    if (els.loginBtn) {
      els.loginBtn.addEventListener('click', async () => {
        addDiagLog('Login requested');
        if (!auth) {
          setError('Firebase初期化に失敗しました。設定を確認してください。');
          return;
        }
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          await auth.signInWithPopup(provider);
          addDiagLog('Login popup completed');
        } catch (err) {
          setError('ログインに失敗しました: ' + err.message);
          addDiagLog(`Login failed: ${err.message}`);
        }
      });
    }

    // Logout button - CRITICAL
    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', async () => {
        addDiagLog('Logout requested');
        if (!auth) {
          setError('Firebase初期化に失敗しました。設定を確認してください。');
          return;
        }
        try {
          await auth.signOut();
          setStatus('Standby');
          addDiagLog('Logout completed');
        } catch (err) {
          setError('ログアウトに失敗しました: ' + err.message);
          addDiagLog(`Logout failed: ${err.message}`);
        }
      });
    }

    // Auth state observer - CRITICAL
    if (auth) {
      auth.onAuthStateChanged((user) => {
        currentUser = user;
        applyAuthUiState(user);
        addDiagLog(`Auth state: ${user ? `logged in uid=${user.uid}` : 'signed out uid=null'}`);
        if (user) {
          refreshQuotaStatus();
          handleHashRoute();
          loadCompanyProfile();
          refreshBillingStatus();
        } else {
          resetQuotaState();
        }
      });
    }

    // Live text display
    updateLiveText();
  }

  // ============================================================
  // NON-CRITICAL PATH - Optional features
  // Each block is wrapped in try/catch; failures do not stop the app
  // ============================================================
  function initNonCritical() {
    // Dev panel & diagnostics
    try {
      setupDevPanel();
      updateDevStatusSummary();
      updateQuotaInfo();
    } catch (err) {
      console.warn('[INIT:non-critical] Dev panel setup failed:', err);
    }

    // BUILD_SHA display
    try {
      fetchBuildSha();
    } catch (err) {
      console.warn('[INIT:non-critical] fetchBuildSha failed:', err);
    }

    // Online/Offline event handlers
    try {
      window.addEventListener('online', () => {
        addDiagLog('[net] Browser online event');
        hideNetworkDisconnectBanner();
        resetDisconnectState();
        tryFinalizePendingJob();
      });
      window.addEventListener('offline', () => {
        addDiagLog('[net] Browser offline event');
      });
    } catch (err) {
      console.warn('[INIT:non-critical] Online/offline handlers failed:', err);
    }

    // Service Worker registration
    try {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
          if (isDebugMode()) {
            console.log('[SW] Debug mode: skipping SW registration');
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) {
              await reg.unregister();
              console.log('[SW] Unregistered:', reg.scope);
            }
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
              await caches.delete(name);
              console.log('[SW] Cache deleted:', name);
            }
            console.log('[SW] Debug mode: SW disabled, caches cleared');
            return;
          }
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            console.log('[SW] Registered:', registration.scope);

            let refreshing = false;
            let newWorker = null;

            registration.addEventListener('updatefound', () => {
              newWorker = registration.installing;
              console.log('[SW] Update found, new worker installing');

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New worker installed, showing update banner');
                  showUpdateBanner(newWorker);
                }
              });
            });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (refreshing) return;
              refreshing = true;
              console.log('[SW] Controller changed, reloading page');
              window.location.reload();
            });

            if (registration.waiting) {
              console.log('[SW] Worker already waiting, showing update banner');
              showUpdateBanner(registration.waiting);
            }
          } catch (err) {
            console.error('[SW] Registration failed:', err);
          }
        });
      }
    } catch (err) {
      console.warn('[INIT:non-critical] SW setup failed:', err);
    }

    // A2HS prompt
    try {
      let deferredPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        if (state.hasShownA2HS) return;
        if (!els.a2hs) return;
        e.preventDefault();
        deferredPrompt = e;
        state.hasShownA2HS = true;
        localStorage.setItem('a2hsShown', '1');
        els.a2hs.classList.add('show');
        setTimeout(async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt = null;
          }
        }, 1500);
      });
    } catch (err) {
      console.warn('[INIT:non-critical] A2HS setup failed:', err);
    }
  }

  // ============================================================
  // MAIN INITIALIZATION ENTRY POINT
  // ============================================================
  try {
    initCritical();
  } catch (err) {
    console.error('[INIT:critical] CRITICAL initialization failed:', err);
    // Even if critical init fails, we try to show an error
    try {
      setError('アプリの初期化に失敗しました。ページを再読み込みしてください。');
    } catch (_) {
      // Last resort
      alert('アプリの初期化に失敗しました。');
    }
  }

  try {
    initNonCritical();
  } catch (err) {
    console.warn('[INIT:non-critical] Non-critical initialization failed:', err);
    // Non-critical failures are silently logged - app continues
  }

  // ============================================================
  // ADDITIONAL UI EVENT HANDLERS
  // These are registered after core init to ensure login works first
  // ============================================================

  if (els.settingsBtn && els.settingsModal) {
    els.settingsBtn.addEventListener('click', () => {
      els.settingsModal.showModal();
      if (currentUser) {
        loadDictionaryList();
      }
      try {
        fetchBuildSha();
      } catch (err) {
        console.warn('[SETTINGS] fetchBuildSha failed:', err);
      }
    });
  }
  if (els.saveSettings) {
    els.saveSettings.addEventListener('click', (e) => {
      e.preventDefault();
      state.maxChars = Number(els.maxChars?.value) || 300;
      state.gapMs = Number(els.gapMs?.value) || 1000;
      state.vadSilence = Number(els.vadSilence?.value) || 400;
      state.uiLang = els.uiLang?.value || 'ja';
      state.inputLang = els.inputLang?.value || 'auto';
      state.outputLang = els.outputLang?.value || 'ja';
      localStorage.setItem('maxChars', state.maxChars);
      localStorage.setItem('gapMs', state.gapMs);
      localStorage.setItem('vadSilence', state.vadSilence);
      localStorage.setItem('uiLang', state.uiLang);
      localStorage.setItem('inputLang', state.inputLang);
      localStorage.setItem('outputLang', state.outputLang);
      const glossaryTextValue = els.glossaryTextInput?.value || '';
      glossaryStorage.set(glossaryTextValue);
      const glossaryEntries = parseGlossary(glossaryTextValue);
      const summaryPromptValue = els.summaryPromptInput?.value || '';
      summaryPromptStorage.set(summaryPromptValue);
      applyI18n();
      els.settingsModal?.close();
      addDiagLog(
        `Settings updated | maxChars=${state.maxChars} gapMs=${state.gapMs} vadSilence=${state.vadSilence} uiLang=${state.uiLang} inputLang=${state.inputLang} outputLang=${state.outputLang} glossary_entries=${glossaryEntries.length} summaryPrompt_len=${state.summaryPrompt.length}`
      );
      updateDevStatusSummary();
    });
  }

  if (els.presetFast) {
    els.presetFast.addEventListener('click', () => applyPreset('fast'));
  }
  if (els.presetBalanced) {
    els.presetBalanced.addEventListener('click', () => applyPreset('balanced'));
  }
  if (els.presetStable) {
    els.presetStable.addEventListener('click', () => applyPreset('stable'));
  }

  // ========== STT Settings Event Handlers ==========
  // Initialize STT UI values from state
  const initSttSettingsUI = () => {
    const stt = state.sttSettings;
    if (els.sttInputLang) els.sttInputLang.value = stt.inputLang;
    if (els.sttVadPreset) els.sttVadPreset.value = stt.vadPreset;
    if (els.sttVadThreshold) els.sttVadThreshold.value = stt.vadThreshold;
    if (els.sttVadSilence) els.sttVadSilence.value = stt.vadSilence;
    if (els.sttVadPrefix) els.sttVadPrefix.value = stt.vadPrefix;
    if (els.sttNoiseReduction) els.sttNoiseReduction.value = stt.noiseReduction;
    if (els.sttTranscriptionModel) els.sttTranscriptionModel.value = stt.transcriptionModel;
    // Show/hide custom VAD inputs
    if (els.sttVadCustom) {
      els.sttVadCustom.style.display = stt.vadPreset === 'custom' ? 'block' : 'none';
    }
    // Show debug payload in debug mode
    if (isDebugMode() && els.sttDebugPayload) {
      els.sttDebugPayload.style.display = 'block';
      if (els.sttDebugPayloadContent) {
        const payload = buildSttPayload();
        els.sttDebugPayloadContent.textContent = payload
          ? JSON.stringify(payload, null, 2)
          : '(no dirty settings)';
      }
    }
  };

  // Save STT settings to localStorage
  const saveSttSettings = () => {
    const stt = state.sttSettings;
    localStorage.setItem('stt_input_lang', stt.inputLang);
    localStorage.setItem('stt_vad_preset', stt.vadPreset);
    localStorage.setItem('stt_vad_threshold', String(stt.vadThreshold));
    localStorage.setItem('stt_vad_silence', String(stt.vadSilence));
    localStorage.setItem('stt_vad_prefix', String(stt.vadPrefix));
    localStorage.setItem('stt_noise_reduction', stt.noiseReduction);
    localStorage.setItem('stt_transcription_model', stt.transcriptionModel);
  };

  // Update debug payload display
  const updateSttDebugPayload = () => {
    if (isDebugMode() && els.sttDebugPayload && els.sttDebugPayloadContent) {
      els.sttDebugPayload.style.display = 'block';
      const payload = buildSttPayload();
      els.sttDebugPayloadContent.textContent = payload
        ? JSON.stringify(payload, null, 2)
        : '(no dirty settings)';
    }
  };

  if (els.sttInputLang) {
    els.sttInputLang.addEventListener('change', () => {
      state.sttSettings.inputLang = els.sttInputLang.value;
      state.sttSettings.dirty.inputLang = true;
      saveSttSettings();
      updateSttDebugPayload();
      addDiagLog(`STT input lang changed: ${state.sttSettings.inputLang}`);
    });
  }

  if (els.sttVadPreset) {
    els.sttVadPreset.addEventListener('change', () => {
      state.sttSettings.vadPreset = els.sttVadPreset.value;
      state.sttSettings.dirty.vadPreset = true;
      saveSttSettings();
      // Show/hide custom inputs
      if (els.sttVadCustom) {
        els.sttVadCustom.style.display = state.sttSettings.vadPreset === 'custom' ? 'block' : 'none';
      }
      updateSttDebugPayload();
      addDiagLog(`STT VAD preset changed: ${state.sttSettings.vadPreset}`);
    });
  }

  // VAD custom inputs
  const handleVadCustomChange = () => {
    state.sttSettings.vadThreshold = Number(els.sttVadThreshold?.value) || 0.65;
    state.sttSettings.vadSilence = Number(els.sttVadSilence?.value) || 800;
    state.sttSettings.vadPrefix = Number(els.sttVadPrefix?.value) || 500;
    state.sttSettings.dirty.vadPreset = true; // Mark as dirty when custom values change
    saveSttSettings();
    updateSttDebugPayload();
  };

  if (els.sttVadThreshold) {
    els.sttVadThreshold.addEventListener('change', handleVadCustomChange);
  }
  if (els.sttVadSilence) {
    els.sttVadSilence.addEventListener('change', handleVadCustomChange);
  }
  if (els.sttVadPrefix) {
    els.sttVadPrefix.addEventListener('change', handleVadCustomChange);
  }

  if (els.sttNoiseReduction) {
    els.sttNoiseReduction.addEventListener('change', () => {
      state.sttSettings.noiseReduction = els.sttNoiseReduction.value;
      state.sttSettings.dirty.noiseReduction = true;
      saveSttSettings();
      updateSttDebugPayload();
      addDiagLog(`STT noise reduction changed: ${state.sttSettings.noiseReduction}`);
    });
  }

  if (els.sttTranscriptionModel) {
    els.sttTranscriptionModel.addEventListener('change', () => {
      state.sttSettings.transcriptionModel = els.sttTranscriptionModel.value;
      state.sttSettings.dirty.transcriptionModel = true;
      saveSttSettings();
      updateSttDebugPayload();
      addDiagLog(`STT transcription model changed: ${state.sttSettings.transcriptionModel}`);
    });
  }

  // Initialize STT UI on page load
  initSttSettingsUI();

  if (els.resetUserSettings) {
    els.resetUserSettings.addEventListener('click', () => {
      glossaryStorage.clear();
      summaryPromptStorage.clear();
      if (els.glossaryTextInput) els.glossaryTextInput.value = '';
      if (els.summaryPromptInput) els.summaryPromptInput.value = '';
      addDiagLog('User settings reset (glossary & summaryPrompt cleared)');
    });
  }

  if (els.settingsBtn && els.settingsModal) {
    els.settingsBtn.addEventListener('click', () => {
      els.settingsModal.showModal();
      // Load dictionary list when settings modal opens
      if (currentUser) {
        loadDictionaryList();
      }
      // Fetch latest BUILD_SHA when settings modal opens (non-critical)
      try {
        fetchBuildSha();
      } catch (err) {
        console.warn('[SETTINGS] fetchBuildSha failed:', err);
      }
    });
  }
  if (els.saveSettings) {
    els.saveSettings.addEventListener('click', (e) => {
      e.preventDefault();
      state.maxChars = Number(els.maxChars?.value) || 300;
      state.gapMs = Number(els.gapMs?.value) || 1000;
      state.vadSilence = Number(els.vadSilence?.value) || 400;
      state.uiLang = els.uiLang?.value || 'ja';
      state.inputLang = els.inputLang?.value || 'auto';
      state.outputLang = els.outputLang?.value || 'ja';
      localStorage.setItem('maxChars', state.maxChars);
      localStorage.setItem('gapMs', state.gapMs);
      localStorage.setItem('vadSilence', state.vadSilence);
      localStorage.setItem('uiLang', state.uiLang);
      localStorage.setItem('inputLang', state.inputLang);
      localStorage.setItem('outputLang', state.outputLang);
      // Save glossary & summary prompt
      const glossaryTextValue = els.glossaryTextInput?.value || '';
      glossaryStorage.set(glossaryTextValue);
      const glossaryEntries = parseGlossary(glossaryTextValue);
      const summaryPromptValue = els.summaryPromptInput?.value || '';
      summaryPromptStorage.set(summaryPromptValue);
      applyI18n();
      els.settingsModal?.close();
      addDiagLog(
        `Settings updated | maxChars=${state.maxChars} gapMs=${state.gapMs} vadSilence=${state.vadSilence} uiLang=${state.uiLang} inputLang=${state.inputLang} outputLang=${state.outputLang} glossary_entries=${glossaryEntries.length} summaryPrompt_len=${state.summaryPrompt.length}`
      );
      updateDevStatusSummary();
    });
  }

  // Preset buttons
  if (els.presetFast) {
    els.presetFast.addEventListener('click', () => applyPreset('fast'));
  }
  if (els.presetBalanced) {
    els.presetBalanced.addEventListener('click', () => applyPreset('balanced'));
  }
  if (els.presetStable) {
    els.presetStable.addEventListener('click', () => applyPreset('stable'));
  }

  // Reset user settings (glossary & summary prompt)
  if (els.resetUserSettings) {
    els.resetUserSettings.addEventListener('click', () => {
      glossaryStorage.clear();
      summaryPromptStorage.clear();
      if (els.glossaryTextInput) els.glossaryTextInput.value = '';
      if (els.summaryPromptInput) els.summaryPromptInput.value = '';
      addDiagLog('User settings reset (glossary & summaryPrompt cleared)');
    });
  }

  // Dictionary CSV Upload
  if (els.uploadDictionaryCsv) {
    els.uploadDictionaryCsv.addEventListener('click', async () => {
      const fileInput = els.dictionaryCsvInput;
      const resultDiv = els.dictionaryUploadResult;
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (resultDiv) resultDiv.textContent = 'CSVファイルを選択してください';
        return;
      }
      const file = fileInput.files[0];
      const fd = new FormData();
      fd.append('file', file);

      els.uploadDictionaryCsv.disabled = true;
      els.uploadDictionaryCsv.textContent = 'アップロード中...';
      if (resultDiv) resultDiv.textContent = '';

      try {
        const res = await authFetch('/api/v1/dictionary/upload', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          let msg = `${data.added || 0}件追加`;
          if (data.duplicatesSkipped) msg += ` / 重複スキップ: ${data.duplicatesSkipped}件`;
          if (data.truncatedByLimit) msg += ` / 上限超過: ${data.truncatedByLimit}件`;
          if (data.warning) msg += `\n${data.warning}`;
          if (resultDiv) {
            resultDiv.textContent = msg;
            resultDiv.className = 'upload-result success';
          }
          addDiagLog(`Dictionary CSV upload success: added=${data.added}`);
          // Reload dictionary list
          loadDictionaryList();
        } else {
          const reason = data.detail?.reason || data.detail || 'アップロード失敗';
          if (resultDiv) {
            resultDiv.textContent = `エラー: ${reason}`;
            resultDiv.className = 'upload-result error';
          }
          addDiagLog(`Dictionary CSV upload failed: ${reason}`);
        }
      } catch (err) {
        if (resultDiv) {
          resultDiv.textContent = `エラー: ${err.message}`;
          resultDiv.className = 'upload-result error';
        }
        addDiagLog(`Dictionary CSV upload error: ${err.message}`);
      } finally {
        els.uploadDictionaryCsv.disabled = false;
        els.uploadDictionaryCsv.textContent = 'アップロード';
        fileInput.value = '';
      }
    });
  }

  // Run Summary button (manual summary generation after Stop)
  if (els.runSummary) {
    els.runSummary.addEventListener('click', async () => {
      const originals = state.logs.join('\n');
      const bilingual = state.logs
        .map((orig, idx) => `${orig}\n${state.translations[idx] || ''}`)
        .join('\n\n');

      if (!originals.trim()) {
        setError(t('errorNoTextToSummarize') || 'No text to summarize');
        return;
      }

      // Validate inputs before sending
      const validation = validateSummarizeInputs(bilingual, state.glossaryText, state.summaryPrompt);
      if (!validation.valid) {
        setError(validation.errors[0] || t('errorPromptInjection'));
        return;
      }

      els.runSummary.disabled = true;
      els.runSummary.textContent = t('generating') || '生成中...';

      try {
        const fd = new FormData();
        // Use validated and sanitized inputs
        fd.append('text', validation.text);
        fd.append('output_lang', state.outputLang);
        if (validation.glossaryText) {
          fd.append('glossary_text', validation.glossaryText);
        }
        if (validation.summaryPrompt) {
          fd.append('summary_prompt', validation.summaryPrompt);
        }
        const res = await authFetch('/summarize', { method: 'POST', body: fd });
        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              t('errorInputTooLong') || 'Input is too long (exceeded limit)'
            );
          }
          throw new Error(t('errorSummaryFailed') || 'Summary generation failed');
        }
        const data = await res.json();
        const summaryMd = data.summary || '';
        if (els.summaryOutput) {
          els.summaryOutput.textContent = summaryMd;
        }
        if (els.copySummary && summaryMd) {
          els.copySummary.style.display = 'inline-block';
        }
        addDiagLog(`Summary generated | length=${summaryMd.length}`);
      } catch (err) {
        const errorMsg = err.message || 'Summary failed';
        setError(errorMsg);
        if (els.summaryOutput) {
          els.summaryOutput.textContent = `エラー: ${errorMsg}`;
        }
        console.error('[runSummary] Error:', err);
        addDiagLog(`Summary error: ${errorMsg}`);
      } finally {
        els.runSummary.disabled = false;
        els.runSummary.textContent = t('generateSummary') || '要約を生成';
      }
    });
  }

  // Copy Summary button
  if (els.copySummary) {
    els.copySummary.addEventListener('click', async () => {
      const text = els.summaryOutput?.textContent || '';
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = els.copySummary.textContent;
        els.copySummary.textContent = t('copied') || 'コピー完了';
        setTimeout(() => {
          els.copySummary.textContent = original;
        }, 1500);
      } catch (err) {
        setError(t('errorCopyFailed') || 'Copy failed');
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    stopMedia();
    closeRtc();
  });

  // Upgrade Pro button click handler
  if (els.upgradeProBtn) {
    els.upgradeProBtn.addEventListener('click', startCheckout);
  }

  // Manage subscription button click handler
  if (els.manageBillingBtn) {
    els.manageBillingBtn.addEventListener('click', openManageSubscription);
  }

  // Buy ticket button click handler - opens modal
  if (els.buyTicketBtn) {
    els.buyTicketBtn.addEventListener('click', openTicketModal);
  }

  // Ticket modal close button
  if (els.ticketModalClose) {
    els.ticketModalClose.addEventListener('click', closeTicketModal);
  }

  // Ticket modal backdrop click to close
  if (els.ticketModal) {
    els.ticketModal.addEventListener('click', (e) => {
      if (e.target === els.ticketModal) {
        closeTicketModal();
      }
    });

    // Ticket pack selection handlers
    els.ticketModal.querySelectorAll('.ticket-pack').forEach((btn) => {
      btn.addEventListener('click', () => {
        const packId = btn.dataset.packId;
        if (packId) {
          selectTicketPack(packId);
        }
      });
    });
  }

  // Save company profile button click handler
  if (els.saveCompanyBtn) {
    els.saveCompanyBtn.addEventListener('click', saveCompanyProfile);
  }

  // Edit company button -> open modal
  if (els.editCompanyBtn) {
    els.editCompanyBtn.addEventListener('click', openCompanyEditModal);
  }

  // Company edit modal close
  if (els.companyEditClose) {
    els.companyEditClose.addEventListener('click', closeCompanyEditModal);
  }
  if (els.companyEditModal) {
    els.companyEditModal.addEventListener('click', (e) => {
      if (e.target === els.companyEditModal) {
        closeCompanyEditModal();
      }
    });
  }

  // Dictionary View navigation
  if (els.openDictionaryBtn) {
    els.openDictionaryBtn.addEventListener('click', navigateToDictionary);
  }
  if (els.dictionaryBackBtn) {
    els.dictionaryBackBtn.addEventListener('click', navigateBackFromDictionary);
  }

  // Hash change listener for SPA routing
  window.addEventListener('hashchange', handleHashRoute);

  // Dictionary UI event handlers
  if (els.downloadDictionaryTemplate) {
    els.downloadDictionaryTemplate.addEventListener('click', downloadDictionaryTemplate);
  }

  if (els.dictAddBtn) {
    els.dictAddBtn.addEventListener('click', addDictionaryEntry);
  }

  if (els.dictLoadMore) {
    els.dictLoadMore.addEventListener('click', () => loadDictionaryList(true));
  }

  // Dictionary table edit/delete buttons (event delegation)
  if (els.dictTableBody) {
    els.dictTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.dataset.id;
      if (!id) return;

      if (btn.classList.contains('dict-edit-btn')) {
        editDictionaryEntry(id);
      } else if (btn.classList.contains('dict-delete-btn')) {
        deleteDictionaryEntry(id);
      }
    });
  }

  // Refresh billing status and quota when returning from Customer Portal or Stripe Checkout
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser) {
      refreshBillingStatus();
      refreshQuotaStatus();
    }
  });

  // Refresh quota on pageshow (bfcache handling)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && currentUser) {
      refreshQuotaStatus();
    }
  });

  // ========== History View Navigation ==========
  if (els.openHistoryBtn) {
    els.openHistoryBtn.addEventListener('click', navigateToHistory);
  }
  if (els.historyBackBtn) {
    els.historyBackBtn.addEventListener('click', navigateBackFromHistory);
  }
  if (els.historyDetailBackBtn) {
    els.historyDetailBackBtn.addEventListener('click', navigateBackFromHistoryDetail);
  }

  // ========== Result Card Summary Button ==========
  if (els.runSummaryCard) {
    els.runSummaryCard.addEventListener('click', async () => {
      const session = state.currentSessionResult;
      if (!session) return;

      const originals = session.originals.join('\n');
      const bilingual = session.originals
        .map((orig, idx) => `${orig}\n${session.translations[idx] || ''}`)
        .join('\n\n');

      if (!originals.trim()) {
        setError(t('errorNoTextToSummarize') || 'No text to summarize');
        return;
      }

      // Validate inputs before sending
      const validation = validateSummarizeInputs(bilingual || originals, state.glossaryText, state.summaryPrompt);
      if (!validation.valid) {
        setError(validation.errors[0] || t('errorPromptInjection'));
        return;
      }

      els.runSummaryCard.disabled = true;
      els.runSummaryCard.textContent = t('generating') || '生成中...';

      try {
        const fd = new FormData();
        fd.append('text', validation.text);
        fd.append('output_lang', state.outputLang);
        if (validation.glossaryText) {
          fd.append('glossary_text', validation.glossaryText);
        }
        if (validation.summaryPrompt) {
          fd.append('summary_prompt', validation.summaryPrompt);
        }
        const res = await authFetch('/summarize', { method: 'POST', body: fd });
        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              t('errorInputTooLong') || 'Input is too long (exceeded limit)'
            );
          }
          throw new Error(t('errorSummaryFailed') || 'Summary generation failed');
        }
        const data = await res.json();
        const summaryMd = data.summary || '';

        // Update session and UI
        session.summary = summaryMd;
        if (els.summaryOutputCard) {
          els.summaryOutputCard.textContent = summaryMd;
        }
        if (els.copySummaryCard && summaryMd) {
          els.copySummaryCard.style.display = 'inline-block';
        }

        // Update history with new summary
        try {
          await historyStorage.save(session);
          addDiagLog(`History updated with summary: ${session.id}`);
        } catch (saveErr) {
          addDiagLog(`History update failed: ${saveErr.message}`);
        }

        addDiagLog(`Summary (card) generated | length=${summaryMd.length}`);
      } catch (err) {
        const errorMsg = err.message || 'Summary failed';
        setError(errorMsg);
        if (els.summaryOutputCard) {
          els.summaryOutputCard.textContent = `エラー: ${errorMsg}`;
        }
        addDiagLog(`Summary (card) error: ${errorMsg}`);
      } finally {
        els.runSummaryCard.disabled = false;
        els.runSummaryCard.textContent = session.summary ? '要約を再生成' : '要約を生成';
      }
    });
  }

  // Copy Summary (card) button
  if (els.copySummaryCard) {
    els.copySummaryCard.addEventListener('click', async () => {
      const text = els.summaryOutputCard?.textContent || '';
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = els.copySummaryCard.textContent;
        els.copySummaryCard.textContent = t('copied') || 'コピー完了';
        setTimeout(() => {
          els.copySummaryCard.textContent = original;
        }, 1500);
      } catch (err) {
        setError(t('errorCopyFailed') || 'Copy failed');
      }
    });
  }

  updateLiveText();
});
