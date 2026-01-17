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
  ticketSecondsBalance: null,
  maxSessionSeconds: null,
  nextResetAt: null,
  blockedReason: null,
  loaded: false,
});

const API_BASE_URL = window.location.origin;
const DEFAULT_REALTIME_MODEL = 'gpt-4o-realtime-preview';
const REALTIME_MODEL = window.OPENAI_REALTIME_MODEL || DEFAULT_REALTIME_MODEL;
const REALTIME_URL = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(REALTIME_MODEL)}`;
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
  const preview = diagLogs.slice(0, 50).join('\n');
  els.devLogArea.textContent = preview || 'ログはまだありません。';
};

const addDiagLog = (msg) => {
  const safeMsg = sanitizeDiagMessage(msg);
  const entry = `[${new Date().toISOString()}] ${safeMsg}`;
  diagLogs.unshift(entry);
  if (diagLogs.length > MAX_DIAG_LOGS) diagLogs.pop();
  refreshDevLogs();
};

const getDiagLogDump = () => diagLogs.slice().reverse().join('\n');

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
      addDiagLog(`authFetch 401 detected, retrying with forceRefresh | url=${url}`);
      return authFetch(url, options, true);
    }
  }

  // If still 401 after retry, sign out and show session expired message
  if (res.status === 401 && _retried) {
    addDiagLog(`authFetch 401 after retry, signing out | url=${url}`);
    setError('セッション期限切れ。再ログインしてください。');
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
    devCloseBtn: document.getElementById('devCloseBtn'),
    devCacheHelp: document.getElementById('devCacheHelp'),
    devNotice: document.getElementById('devNotice'),
  };
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
  const text = getDiagLogDump() || '診断ログはまだありません。';
  try {
    await navigator.clipboard.writeText(text);
    showDevNotice('診断ログをコピーしました');
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
      showDevNotice('診断ログをコピーしました（フォールバック）');
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

const formatMinutes = (seconds) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '–';
  return Math.max(0, Math.floor(seconds / 60));
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
    els.quotaInfo.textContent = `本日: ${dailyText} / 今月: ${totalText}`;
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
    return;
  }
  const planLabel = q.plan === 'pro' ? 'Pro' : 'Free';
  const monthlyMin = formatMinutes(q.baseRemainingThisMonth);
  const ticketMin = formatMinutes(q.ticketSecondsBalance);
  const totalMin = formatMinutes(q.totalAvailableThisMonth);
  const nextReset = formatNextReset(q.nextResetAt);
  els.quotaBreakdown.innerHTML = `
    <div class="breakdown-row"><span>プラン:</span><span>${planLabel}</span></div>
    <div class="breakdown-row"><span>月間残り:</span><span>${monthlyMin}分</span></div>
    <div class="breakdown-row"><span>チケット残高:</span><span>${ticketMin}分</span></div>
    <div class="breakdown-row total"><span>合計:</span><span>${totalMin}分</span></div>
    <div class="breakdown-row reset"><span>次回リセット:</span><span>${nextReset}</span></div>
  `;
};

const applyQuotaFromPayload = (payload = {}) => {
  const next = {
    plan: payload.plan || state.quota.plan || 'free',
    baseRemainingThisMonth: numberOrNull(payload.baseRemainingThisMonth),
    totalAvailableThisMonth: numberOrNull(payload.totalAvailableThisMonth),
    baseDailyQuotaSeconds: numberOrNull(payload.baseDailyQuotaSeconds),
    dailyRemainingSeconds: numberOrNull(payload.dailyRemainingSeconds),
    ticketSecondsBalance: numberOrNull(payload.ticketSecondsBalance),
    maxSessionSeconds: numberOrNull(
      payload.maxSessionSeconds != null ? payload.maxSessionSeconds : state.quota.maxSessionSeconds,
    ),
    nextResetAt: payload.nextResetAt || null,
    blockedReason: payload.blockedReason || null,
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
    const res = await authFetch('/api/v1/me');
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

const reserveJobSlot = async () => {
  addDiagLog('Requesting job reservation');
  const res = await authFetch('/api/v1/jobs/create', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = extractErrorMessage(data, 'ジョブの予約に失敗しました。');
    throw new Error(message);
  }
  state.currentJob = {
    jobId: data.jobId,
    reservedSeconds: data.reservedSeconds,
    reservedBaseSeconds: data.reservedBaseSeconds,
    reservedTicketSeconds: data.reservedTicketSeconds,
  };
  state.jobStartedAt = Date.now();
  applyQuotaFromPayload(data);
  addDiagLog(`Job reserved | jobId=${data.jobId}`);
  return data;
};

const getJobElapsedSeconds = () => {
  if (!state.jobStartedAt) return null;
  return Math.max(0, Math.round((Date.now() - state.jobStartedAt) / 1000));
};

const completeCurrentJob = async (audioSeconds) => {
  if (!state.currentJob) return null;
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
    addDiagLog(`Job completed | billed=${data.billedSeconds ?? 'n/a'}s`);
    return data;
  } catch (err) {
    addDiagLog(`Job completion failed: ${err.message || err}`);
    return null;
  } finally {
    state.currentJob = null;
    state.jobStartedAt = null;
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
    state.dataChannel.close();
  }
  if (state.pc) {
    state.pc.getSenders().forEach((s) => s.track && s.track.stop());
    state.pc.close();
  }
  state.pc = null;
  state.dataChannel = null;
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
  try {
    const payload = JSON.parse(event.data);
    const type = payload.type || payload.event || '';
    if (type === 'conversation.item.input_audio_transcription.delta') {
      handleDelta(payload);
    } else if (type === 'conversation.item.input_audio_transcription.completed') {
      handleCompleted(payload);
    } else if (type === 'error' || payload.type === 'error') {
      setError(payload.error?.message || payload.message || 'Realtime error');
    }
  } catch (err) {
    console.error('message parse', err);
  }
};

  const negotiate = async (clientSecret) => {
  const pc = new RTCPeerConnection();
  state.pc = pc;
  state.dataChannel = pc.createDataChannel('oai-events');
  state.dataChannel.onmessage = handleDataMessage;
  state.dataChannel.onclose = () => setStatus('Closed');

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

  // デバッグ: SDP offer の検証
  console.log('[negotiate] Realtime URL:', REALTIME_URL);
  console.log('[negotiate] clientSecret prefix:', clientSecret ? `${clientSecret.substring(0, 10)}...` : 'missing');
  console.log('[negotiate] Offer SDP length:', offerSdp.length);
  if (!offerSdp.includes('v=0')) console.warn('[negotiate] SDP missing v=0');
  if (!offerSdp.includes('m=audio')) console.warn('[negotiate] SDP missing m=audio');
  if (!offerSdp.includes('a=ice-ufrag')) console.warn('[negotiate] SDP missing a=ice-ufrag');
  if (!offerSdp.includes('a=ice-pwd')) console.warn('[negotiate] SDP missing a=ice-pwd');

  // OpenAI Realtime API (ephemeral flow): Content-Type: application/sdp, body: raw SDP
  // model パラメータを URL に追加
  const res = await fetch(REALTIME_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      'Content-Type': 'application/sdp',
    },
    body: offerSdp,
  });

  console.log('[negotiate] Response status:', res.status);
  console.log('[negotiate] Response Location header:', res.headers.get('Location'));

  if (!res.ok) {
    let errorBody = '';
    try {
      errorBody = await res.text();
    } catch (err) {
      console.error('[negotiate] Response text read failed:', err);
    }
    console.error('[negotiate] OpenAI realtime negotiate FAILED');
    console.error('[negotiate] Status:', res.status, res.statusText);
    console.error('[negotiate] Response headers:', [...res.headers.entries()]);
    if (errorBody) {
      console.error('[negotiate] Response body:', errorBody);
    }
    throw new Error(
      `Realtime negotiate failed (${res.status} ${res.statusText}): ${errorBody || 'no body'}`
    );
  }

  const answerSdp = await res.text();
  console.log('[negotiate] Answer SDP length:', answerSdp.length);
  console.log('[negotiate] Answer SDP starts with v=0:', answerSdp.startsWith('v=0'));
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  console.log('[negotiate] setRemoteDescription completed');
  setStatus('Connecting');
};

const start = async () => {
  addDiagLog('Start requested');
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
  if (!state.quota.loaded) {
    await refreshQuotaStatus();
  }
  if (!hasQuotaForStart()) {
    els.start.disabled = false;
    els.stop.disabled = true;
    return;
  }
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
  updateLiveText();
  setError('');

  try {
    await reserveJobSlot();
    setStatus('Preparing');
    const fd = new FormData();
    fd.append('vad_silence', String(state.vadSilence));
    addDiagLog('Requesting realtime token');
    const res = await authFetch('/token', { method: 'POST', body: fd });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const detail = errJson.detail || errJson.message || 'token取得に失敗';
      throw new Error(detail);
    }
    const data = await res.json();
    const clientSecret = data.value;
    if (!clientSecret) throw new Error('client secret missing');
    addDiagLog('Realtime token received');
    await negotiate(clientSecret);
    setStatus('Listening');
    addDiagLog('Realtime negotiation completed');
  } catch (err) {
    setError(err.message || 'start error');
    els.start.disabled = false;
    els.stop.disabled = true;
    stopMedia();
    closeRtc();
    await completeCurrentJob(0);
    addDiagLog(`Start failed: ${err.message || err}`);
  }
};

const stop = async () => {
  addDiagLog('Stop requested');
  els.start.disabled = false;
  els.stop.disabled = true;
  clearGapTimer();
  stopMedia();
  closeRtc();
  setStatus('Standby');

  if (state.recorder) {
    state.recorder.stop();
  }
  if (state.recordingChunks.length) {
    const blob = new Blob(state.recordingChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    appendDownload('webm', url);
    try {
      await uploadForM4A(blob);
    } catch (err) {
      setError(err.message);
    }
  }

  const elapsedSeconds = getJobElapsedSeconds();
  await completeCurrentJob(elapsedSeconds);
  await saveTextDownloads();
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
  addDiagLog('DOM ready');
  cacheElements();
  scrubDebugArtifacts();
  setupDevPanel();
  updateDevStatusSummary();
  updateQuotaInfo();

  if (els.maxChars) els.maxChars.value = state.maxChars;
  if (els.gapMs) els.gapMs.value = state.gapMs;
  if (els.vadSilence) els.vadSilence.value = state.vadSilence;
  if (els.uiLang) els.uiLang.value = state.uiLang;
  if (els.inputLang) els.inputLang.value = state.inputLang;
  if (els.outputLang) els.outputLang.value = state.outputLang;

  // Apply i18n on load
  applyI18n();

  if (els.start) els.start.addEventListener('click', start);
  if (els.stop) els.stop.addEventListener('click', stop);

  if (els.settingsBtn && els.settingsModal) {
    els.settingsBtn.addEventListener('click', () => els.settingsModal.showModal());
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
      applyI18n();
      els.settingsModal?.close();
      addDiagLog(
        `Settings updated | maxChars=${state.maxChars} gapMs=${state.gapMs} vadSilence=${state.vadSilence} uiLang=${state.uiLang} inputLang=${state.inputLang} outputLang=${state.outputLang}`
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

  window.addEventListener('beforeunload', () => {
    stopMedia();
    closeRtc();
  });

  // Service Worker 登録（debug=1 時は無効化）
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      if (isDebugMode()) {
        // debug=1: SW を無効化し、既存の登録を解除
        console.log('[SW] Debug mode: skipping SW registration');
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          console.log('[SW] Unregistered:', reg.scope);
        }
        // キャッシュもクリア
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
          console.log('[SW] Cache deleted:', name);
        }
        console.log('[SW] Debug mode: SW disabled, caches cleared');
        return;
      }
      // 通常モード: SW を登録
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    });
  }

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

  initFirebase();
  applyAuthUiState(null);

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

  if (auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      applyAuthUiState(user);
      addDiagLog(user ? 'Auth state: logged in' : 'Auth state: signed out');
      if (user) {
        refreshQuotaStatus();
      } else {
        resetQuotaState();
      }
    });
  }

  updateLiveText();
});
