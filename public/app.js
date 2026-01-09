const els = {
  status: document.getElementById('status'),
  subtitleOriginal: document.getElementById('subtitleOriginal'),
  subtitleTranslation: document.getElementById('subtitleTranslation'),
  historyOriginal: document.getElementById('historyOriginal'),
  historyTranslation: document.getElementById('historyTranslation'),
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
  upgrade: document.getElementById('upgrade'),
  upgradeLink: document.getElementById('upgradeLink'),
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
  token: null,
  hasShownA2HS: localStorage.getItem('a2hsShown') === '1',
  segments: [],
  jobId: null,
  jobYyyymm: null,
  remainingSeconds: null,
  recordingStartedAt: null,
};

els.maxChars.value = state.maxChars;
els.gapMs.value = state.gapMs;
els.vadSilence.value = state.vadSilence;

const setStatus = (text) => {
  els.status.textContent = text;
};

const setError = (text) => {
  els.error.textContent = text || '';
};

const setUpgradeVisible = (visible) => {
  if (!els.upgrade) return;
  els.upgrade.hidden = !visible;
};

const getAuthToken = async () => {
  if (window.firebaseAuth?.currentUser) {
    return window.firebaseAuth.currentUser.getIdToken();
  }
  return localStorage.getItem('firebaseIdToken') || '';
};

const buildAuthHeaders = async () => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('ログインが必要です');
  }
  return { Authorization: `Bearer ${token}` };
};

const trimTail = (text, limit) => {
  if (!limit || text.length <= limit) return text;
  return '…' + text.slice(text.length - limit);
};

const appendDownload = (label, url) => {
  const link = document.createElement('a');
  link.href = url;
  link.textContent = label;
  link.download = '';
  els.downloads.appendChild(link);
};

const resetDownloads = () => {
  els.downloads.innerHTML = '';
};

const updateLiveText = () => {
  const translationLimit = Math.max(80, state.maxChars);

  // ① ライブ表示（既存と同じ）
  els.subtitleOriginal.textContent =
    trimTail(state.liveOriginal || '・・・', state.maxChars);
  els.subtitleTranslation.textContent =
    trimTail(state.liveTranslation || '・・・', translationLimit);

  // ② 履歴表示（追加）
  const segments = state.segments || [];
  const orig = segments.map(s => s.source).join('\n\n');
  const jp   = segments.map(s => s.translation).join('\n\n');

  // 履歴は長くなるので、必要なら末尾だけ見せる（ここでは大きめ）
  els.historyOriginal.textContent = trimTail(orig, state.maxChars * 20);
  els.historyTranslation.textContent = trimTail(jp, state.maxChars * 20);
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
  state.recordingStartedAt = Date.now();
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
  const res = await fetch('/audio_m4a', { method: 'POST', body: fd });
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
    const summaryRes = await fetch('/summarize', {
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

const createJob = async () => {
  const headers = await buildAuthHeaders();
  const res = await fetch('/api/v1/jobs/create', { method: 'POST', headers });
  if (res.status === 402) {
    setUpgradeVisible(true);
    throw new Error('無料枠を使い切りました。アップグレードしてください。');
  }
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || 'ジョブ作成に失敗しました');
  }
  const data = await res.json();
  state.jobId = data.jobId || null;
  state.jobYyyymm = data.yyyymm || null;
  state.remainingSeconds = data.remainingSeconds ?? null;
  setUpgradeVisible(false);
  return data;
};

const completeJob = async (audioSeconds) => {
  if (!state.jobId) return;
  let headers;
  try {
    headers = await buildAuthHeaders();
  } catch (err) {
    setError(err.message);
    return;
  }
  const res = await fetch('/api/v1/jobs/complete', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: state.jobId, audioSeconds }),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    setError(errJson.detail || 'ジョブ完了の登録に失敗しました');
  }
  state.jobId = null;
  state.jobYyyymm = null;
  state.remainingSeconds = null;
};

const translateCompleted = async (text) => {
  try {
    // ① まず原文を履歴に積む（訳は仮）
    const seg = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      source: text,
      translation: '（翻訳中…）',
    };
    state.segments.push(seg);

    // live表示（任意：最新行の表示に使うなら）
    state.liveTranslation = seg.translation;

    updateLiveText(); // ← ここは「segmentsを描画」するように後述どおり変更

    // ② 翻訳APIを呼ぶ
    const fd = new FormData();
    fd.append('text', text);
    const res = await fetch('/translate', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('翻訳に失敗しました');
    const data = await res.json();

    // ③ さっき追加した履歴の translation を更新
    seg.translation = data.translation || '';
    state.liveTranslation = seg.translation; // 最新表示したい場合

    updateLiveText();
  } catch (err) {
    setError(err.message);
  }
};

const commitLog = (text, itemId = null) => {
  if (!text || !text.trim()) return;
  state.logs.push(text);
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

  const res = await fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      'Content-Type': 'application/sdp',
    },
    body: pc.localDescription.sdp,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Realtime negotiate failed: ${text || res.statusText}`);
  }
  const answerSdp = await res.text();
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  setStatus('Connecting');
};

const start = async () => {
  els.start.disabled = true;
  els.stop.disabled = false;
  clearGapTimer();
  resetDownloads();
  state.logs = [];
  state.segments = [];
  state.translations = [];
  state.liveOriginal = '';
  state.liveTranslation = '';
  state.partialByItem = new Map();
  state.committedItems = new Set();
  state.activeItemId = null;
  state.jobId = null;
  state.jobYyyymm = null;
  state.remainingSeconds = null;
  state.recordingStartedAt = null;
  updateLiveText();
  setError('');
  setUpgradeVisible(false);

  try {
    await createJob();
    const fd = new FormData();
    fd.append('vad_silence', String(state.vadSilence));
    const res = await fetch('/token', { method: 'POST', body: fd });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const detail = errJson.detail || errJson.message || 'token取得に失敗';
      throw new Error(detail);
    }
    const data = await res.json();
    const clientSecret = data.value;
    if (!clientSecret) throw new Error('client secret missing');
    await negotiate(clientSecret);
    setStatus('Listening');
  } catch (err) {
    setError(err.message || 'start error');
    els.start.disabled = false;
    els.stop.disabled = true;
    stopMedia();
    closeRtc();
  }
};

const stop = async () => {
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

  const audioSeconds = state.recordingStartedAt
    ? Math.max(0, Math.ceil((Date.now() - state.recordingStartedAt) / 1000))
    : 0;
  state.recordingStartedAt = null;
  await completeJob(audioSeconds);

  await saveTextDownloads();
};

els.start.addEventListener('click', start);
els.stop.addEventListener('click', stop);

els.settingsBtn.addEventListener('click', () => els.settingsModal.showModal());
els.saveSettings.addEventListener('click', (e) => {
  e.preventDefault();
  state.maxChars = Number(els.maxChars.value) || 300;
  state.gapMs = Number(els.gapMs.value) || 1000;
  state.vadSilence = Number(els.vadSilence.value) || 400;
  localStorage.setItem('maxChars', state.maxChars);
  localStorage.setItem('gapMs', state.gapMs);
  localStorage.setItem('vadSilence', state.vadSilence);
  els.settingsModal.close();
});

window.addEventListener('beforeunload', () => {
  stopMedia();
  closeRtc();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  if (state.hasShownA2HS) return;
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

updateLiveText();
