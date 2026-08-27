'use strict';

const GENERIC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const ENGINES = [
  { key: 'g',  name: 'Google',        color: '#4285F4', url: 'https://www.google.com/search?q=%s' },
  { key: 'd',  name: 'DuckDuckGo',    color: '#DE5833', url: 'https://duckduckgo.com/?q=%s' },
  { key: 'b',  name: 'Bing',          color: '#008373', url: 'https://www.bing.com/search?q=%s&form=QBLH' },
  { key: 'br', name: 'Brave Search',  color: '#FB542B', url: 'https://search.brave.com/search?q=%s' },
  { key: 'sp', name: 'Startpage',     color: '#6573FF', url: 'https://www.startpage.com/sp/search?query=%s' },
  { key: 'mo', name: 'Mojeek',        color: '#B549E8', url: 'https://www.mojeek.com/search?q=%s' },
  { key: 'qw', name: 'Qwant',         color: '#5C71D6', url: 'https://www.qwant.com/?q=%s' },
  { key: 'ec', name: 'Ecosia',        color: '#008009', url: 'https://www.ecosia.org/search?q=%s' },
  { key: 'sx', name: 'SearXNG',       color: '#3050FF', url: 'https://searx.be/search?q=%s' },
  { key: 'pp', name: 'Perplexity',    color: '#20808D', url: 'https://www.perplexity.ai/search?q=%s' },
  { key: 'ya', name: 'Yandex',        color: '#FC3F1D', url: 'https://yandex.com/search/?text=%s' },
  { key: 'bd', name: 'Baidu 百度',     color: '#2932E1', url: 'https://www.baidu.com/s?wd=%s' },
  { key: 'na', name: 'Naver 네이버',   color: '#03C75A', url: 'https://search.naver.com/search.naver?query=%s' },
  { key: 'sj', name: 'پارسیجو',        color: '#E2574C', url: 'https://parsijoo.ir/web?q=%s' },
  { key: 'yh', name: 'Yahoo',         color: '#6001D2', url: 'https://search.yahoo.com/search?p=%s' },
  { key: 'sz', name: 'Seznam',        color: '#CC0000', url: 'https://search.seznam.cz/?q=%s' },
  { key: 'w',  name: 'ویکی‌پدیا',      color: '#636466', url: 'https://fa.wikipedia.org/wiki/Special:Search?search=%s' },
  { key: 'yt', name: 'YouTube',       color: '#FF0000', url: 'https://www.youtube.com/results?search_query=%s' },
  { key: 'gh', name: 'GitHub',        color: '#24292E', url: 'https://github.com/search?q=%s' },
  { key: 'so', name: 'StackOverflow', color: '#F48024', url: 'https://stackoverflow.com/search?q=%s' },
  { key: 'rd', name: 'Reddit',        color: '#FF4500', url: 'https://www.reddit.com/search/?q=%s' },
  { key: 'x',  name: 'X / Twitter',   color: '#111111', url: 'https://x.com/search?q=%s' },
  { key: 'wa', name: 'WolframAlpha',  color: '#DD1100', url: 'https://www.wolframalpha.com/input?i=%s' },
  { key: 'gi', name: 'تصاویر گوگل',    color: '#34A853', url: 'https://www.google.com/search?tbm=isch&q=%s' },
  { key: 'gs', name: 'گوگل اسکالر',    color: '#4285F4', url: 'https://scholar.google.com/scholar?q=%s' },
  { key: 'tr', name: 'ترجمه گوگل',     color: '#1A73E8', url: 'https://translate.google.com/?sl=auto&tl=fa&text=%s&op=translate' },
  { key: 'im', name: 'IMDb',          color: '#F57802', url: 'https://www.imdb.com/find/?q=%s' },
  { key: 'ma', name: 'نقشه‌ها',        color: '#4285F4', url: 'https://www.google.com/maps/search/%s' }
];
const ENGINE_BY_KEY = Object.fromEntries(ENGINES.map(e => [e.key, e]));

const DEFAULT_TILES = [
  { name: 'ویکی‌فا', url: 'https://fa.wikipedia.org', color: '#636466' },
  { name: 'GitHub', url: 'https://github.com', color: '#24292E' },
  { name: 'YouTube', url: 'https://youtube.com', color: '#FF0000' },
  { name: 'Reddit', url: 'https://reddit.com', color: '#FF4500' },
  { name: 'StackOverflow', url: 'https://stackoverflow.com', color: '#F48024' },
  { name: 'دیجیاتو', url: 'https://digiato.com', color: '#0aa3c2' }
];

let PREFS = null;
let tabs = [];
let activeId = null;
let idSeq = 1;
let torState = 'off';
let torInfoCache = null;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const el = {
  tabs: $('#tabs'), content: $('#content'), home: $('#home'),
  omnibox: $('#omnibox'), omniWrap: $('#omnibox-wrap'),
  engineChip: $('#engineChip'), engineDot: $('#engineDot'), engineName: $('#engineName'),
  suggest: $('#suggest'), engineMenu: $('#engineMenu'),
  secIcon: $('#secIcon'),
  back: $('#btnBack'), fwd: $('#btnFwd'), reload: $('#btnReload'), homeBtn: $('#btnHome'),
  newTab: $('#btnNewTab'), btnTor: $('#btnTor'), torDot: $('#torDot'),
  shield: $('#btnShield'), shieldMenu: $('#shieldMenu'),
  find: $('#btnFind'), findbar: $('#findbar'), findInput: $('#findInput'),
  findCount: $('#findCount'), settingsBtn: $('#btnSettings'),
  progress: $('#progress'), progressBar: $('#progressBar'),
  clock: $('#clock'), dateLine: $('#dateLine'), greet: $('#greet'),
  homeSearch: $('#homeSearch'), homeGo: $('#homeGo'),
  homeEngineChip: $('#homeEngineChip'), homeEngineDot: $('#homeEngineDot'), homeEngineName: $('#homeEngineName'),
  tiles: $('#tiles'), torPill: $('#torPill'), torPillText: $('#torPillText'),
  toasts: $('#toasts'),
  ctxmenu: $('#ctxmenu'),
  wcMin: $('#wcMin'), wcMax: $('#wcMax'), wcClose: $('#wcClose')
};

// Zoom indicator — created dynamically so the HTML stays untouched.
const zoomBtn = document.createElement('button');
zoomBtn.id = 'zoomBtn';
zoomBtn.className = 'tool icon-btn';
zoomBtn.title = 'بازنشانی زوم (Ctrl+0)';
zoomBtn.textContent = '100%';
el.toolbar = $('#toolbar');
el.toolbar.insertBefore(zoomBtn, el.find);
el.zoomBtn = zoomBtn;
zoomBtn.addEventListener('click', () => zoom(0));

function activeTab() { return tabs.find(t => t.id === activeId) || null; }

function toast(msg, ms = 3500) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  el.toasts.appendChild(d);
  setTimeout(() => {
    d.classList.add('out');
    setTimeout(() => d.remove(), 260);
  }, ms);
}

function fmtBytes(n) {
  if (!n) return '';
  const u = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}

function looksLikeUrl(s) {
  if (!s || /\s/.test(s)) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (/^localhost(:\d+)?(\/|$)/i.test(s)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(s)) return true;
  return /^[\w-]+(\.[\w-]{2,})+(\/|$|:\d+)/.test(s);
}

function normalizeUrl(s) {
  if (/^https?:\/\//i.test(s)) return s;
  return 'http://' + s;
}

function resolveInput(input) {
  const bang = input.match(/^!([a-z]{1,3})\s*([\s\S]*)$/i);
  if (bang) {
    const eng = ENGINE_BY_KEY[bang[1].toLowerCase()];
    const q = bang[2].trim();
    if (eng && q) return eng.url.replace('%s', encodeURIComponent(q));
  }
  if (looksLikeUrl(input)) return normalizeUrl(input.trim());
  const eng = ENGINE_BY_KEY[PREFS.defaultEngine] || ENGINES[1];
  return eng.url.replace('%s', encodeURIComponent(input.trim()));
}

async function savePrefs(patch) {
  PREFS = await window.onyx.setPrefs(patch);
}

function applyTheme() {
  document.documentElement.dataset.theme = PREFS.theme;
  document.documentElement.dataset.bg = PREFS.bgStyle;
  document.documentElement.style.setProperty('--accent', PREFS.accent);
  const hex = PREFS.accent;
  try {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r},${g},${b},.18)`);
  } catch {}
  document.documentElement.style.setProperty('--ui-font', PREFS.fontSize + 'px');
  document.body.classList.toggle('no-anim', !PREFS.animations);
}

function currentEngine() {
  return ENGINE_BY_KEY[PREFS.defaultEngine] || ENGINES[1];
}

function renderEngineChip() {
  const e = currentEngine();
  el.engineName.textContent = e.name;
  el.homeEngineName.textContent = e.name;
  for (const dot of [el.engineDot, el.homeEngineDot]) {
    dot.style.setProperty('--eng-color', e.color);
    dot.style.background = e.color;
    dot.style.boxShadow = `0 0 6px ${e.color}`;
  }
}

function createTab({ url = null, tor: useTor = false, activate = true } = {}) {
  if (useTor && prefsBlockTor()) return null;
  const tab = {
    id: idSeq++,
    title: 'تب جدید',
    icon: null,
    url: url,
    loading: !!url,
    tor: useTor,
    view: null,
    wrap: null,
    error: null
  };
  tabs.push(tab);

  tab.wrap = document.createElement('div');
  tab.wrap.className = 'page-wrap';
  el.content.appendChild(tab.wrap);

  const li = document.createElement('div');
  li.className = 'tab';
  li.dataset.id = tab.id;
  li.innerHTML = `
    <span class="tab-icon"></span>
    <span class="tab-title"></span>
    <button class="close-x" title="بستن (Ctrl+W)">
      <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>`;
  li.addEventListener('mousedown', ev => {
    if (ev.button === 0) activateTab(tab.id);
    else if (ev.button === 1) closeTab(tab.id);
  });
  li.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    if (activeId !== tab.id) activateTab(tab.id);
    showTabMenu(tab, ev);
  });
  li.querySelector('.close-x').addEventListener('click', ev => {
    ev.stopPropagation();
    closeTab(tab.id);
  });
  el.tabs.appendChild(li);
  tab.li = li;

  if (url) ensureView(tab).setAttribute('src', url);
  if (activate) activateTab(tab.id);
  renderTabs();
  return tab;
}

function prefsBlockTor() {
  return torState !== 'on' && !startingTor();
}
let torStartingFlag = false;
function startingTor() { return torStartingFlag; }

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  const tab = tabs[idx];
  try { if (tab.view) { tab.view.stop(); tab.view.remove(); } } catch {}
  tab.wrap.remove();
  tab.li.remove();
  tabs.splice(idx, 1);
  if (!tabs.length) {
    createTab({});
    return;
  }
  if (activeId === id) {
    activateTab(tabs[Math.min(idx, tabs.length - 1)].id);
  }
  renderTabs();
}

function activateTab(id) {
  activeId = id;
  for (const t of tabs) {
    t.li.classList.toggle('active', t.id === id);
    t.wrap.classList.toggle('visible', t.id === id && !!t.view);
  }
  const tab = activeTab();
  el.home.classList.toggle('visible', !tab.view);
  syncToolbar();
  hideMenus();
}

function renderTabs() {
  for (const t of tabs) {
    const iconEl = t.li.querySelector('.tab-icon');
    const titleEl = t.li.querySelector('.tab-title');
    titleEl.textContent = t.title;
    if (t.loading) {
      iconEl.innerHTML = '<span class="spin"></span>';
    } else if (t.tor) {
      iconEl.innerHTML = `<svg class="onion-mini" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M12 3c3 3.5 5 6.2 5 9.5A5 5 0 0 1 12 17.5 5 5 0 0 1 7 12.5C7 9.2 9 6.5 12 3z"/></svg>`;
    } else if (t.icon) {
      iconEl.innerHTML = `<img src="${t.icon}" onerror="this.parentNode.textContent='🌐'">`;
    } else {
      iconEl.innerHTML = '<span style="opacity:.55;font-size:11px">🌐</span>';
    }
  }
}

function ensureView(tab) {
  if (tab.view) return tab.view;
  const wv = document.createElement('webview');
  wv.className = 'page';
  wv.setAttribute('partition', tab.tor ? 'onyx-tor' : 'onyx-clear');
  wv.setAttribute('allowpopups', '');
  bindWebview(tab, wv);
  tab.view = wv;
  tab.wrap.appendChild(wv);
  return wv;
}

function bindWebview(tab, wv) {
  wv.addEventListener('did-start-loading', () => {
    tab.loading = true;
    if (tab.id === activeId) setProgress(true);
    renderTabs();
  });
  wv.addEventListener('did-stop-loading', () => {
    tab.loading = false;
    if (tab.id === activeId) setProgress(false);
    renderTabs();
    syncToolbar();
  });
  wv.addEventListener('did-navigate', e => {
    tab.url = e.url;
    tab.error = null;
    clearErrorCard(tab);
    if (tab.id === activeId) { syncOmnibox(); hideHome(); }
  });
  wv.addEventListener('did-navigate-in-page', e => {
    if (e.url && e.isMainFrame !== false) {
      tab.url = e.url;
      if (tab.id === activeId) syncOmnibox();
    }
  });
  wv.addEventListener('page-title-updated', e => {
    tab.title = e.title || 'بدون عنوان';
    renderTabs();
  });
  wv.addEventListener('page-favicon-updated', e => {
    if (e.favicons && e.favicons.length) tab.icon = e.favicons[e.favicons.length - 1];
    renderTabs();
  });
  wv.addEventListener('new-window', e => {
    if (!e.url) return;
    createTab({ url: e.url, tor: tab.tor, activate: e.disposition !== 'background-tab' });
  });
  wv.addEventListener('enter-html-full-screen', () => {
    document.body.classList.add('htmlfs');
    window.onyx.fullscreen(true);
  });
  wv.addEventListener('leave-html-full-screen', () => {
    document.body.classList.remove('htmlfs');
    window.onyx.fullscreen(false);
  });
  wv.addEventListener('did-fail-load', e => {
    if (!e.isMainFrame || e.errorCode === -3) return;
    tab.error = { code: e.errorCode, desc: e.errorDescription, url: e.validatedURL || tab.url };
    showErrorCard(tab);
  });
  wv.addEventListener('render-process-gone', () => {
    tab.error = { code: 'CRASH', desc: 'فرایند صفحه از کار افتاد', url: tab.url };
    showErrorCard(tab);
  });
  wv.addEventListener('found-in-page', e => {
    if (e.result && e.result.matches != null) {
      el.findCount.textContent = `${e.result.activeMatchOrdinal ?? 0} از ${e.result.matches}`;
    }
  });
  wv.addEventListener('context-menu', e => showCtxMenu(e.params, wv));
}

function setProgress(on) {
  el.progress.classList.toggle('on', on);
  el.progressBar.style.width = on ? '40%' : '0%';
}

function showErrorCard(tab) {
  clearErrorCard(tab);
  const card = document.createElement('div');
  card.className = 'err-card';
  card.innerHTML = `
    <div class="err-inner">
      <div class="err-code">${tab.tor && tab.error.code === -109 ? '🧅' : '⚠️'}</div>
      <div class="err-msg">${tab.error.desc || ''}<br/><small>${tab.error.url || ''}</small></div>
      <div class="err-actions">
        <button class="accent-btn retry">تلاش دوباره</button>
        <button class="danger-btn gohome">صفحه خانه</button>
      </div>
    </div>`;
  card.querySelector('.retry').addEventListener('click', () => {
    clearErrorCard(tab);
    goBackOrReload(tab, true);
  });
  card.querySelector('.gohome').addEventListener('click', () => {
    clearErrorCard(tab);
    navigate(tab, '', { forceHome: true });
  });
  tab.wrap.appendChild(card);
  tab.errCard = card;
}

function clearErrorCard(tab) {
  if (tab.errCard) { tab.errCard.remove(); tab.errCard = null; }
  tab.error = null;
}

function goBackOrReload(tab, reloadOnly) {
  if (!tab.view) return;
  if (reloadOnly || !tab.view.canGoBack()) tab.view.reload();
  else tab.view.goBack();
}

async function navigate(tab, input, opts = {}) {
  hideMenus();
  if (opts.forceHome || (!input && !PREFS.homepage)) {
    destroyView(tab);
    showHome();
    return;
  }
  const urlStr = input || PREFS.homepage;
  const url = looksLikeUrl(urlStr) && /^https?:/i.test(urlStr) ? urlStr : resolveInput(urlStr);
  const wv = ensureView(tab);
  if (!wv.getAttribute('src')) {
    wv.setAttribute('src', url);
  } else {
    wv.loadURL(url);
  }
  tab.url = url;
  hideHome();
  syncOmnibox();
  renderTabs();
}

function destroyView(tab) {
  if (tab.view) {
    try { tab.view.stop(); } catch {}
    tab.view.remove();
    tab.view = null;
  }
  clearErrorCard(tab);
  tab.wrap.classList.remove('visible');
  tab.url = null;
  tab.icon = null;
  tab.title = 'تب جدید';
  tab.loading = false;
  renderTabs();
}

function showHome() {
  el.home.classList.add('visible');
  setTimeout(() => el.homeSearch.focus(), 60);
}

function hideHome() {
  el.home.classList.remove('visible');
}

function syncOmnibox() {
  const tab = activeTab();
  if (!tab || document.activeElement === el.omnibox) return;
  el.omnibox.value = tab.url || '';
  updateSecIcon(tab);
}

function updateSecIcon(tab) {
  const u = tab.url || '';
  let svg, color, title;
  if (tab.tor) {
    svg = '<svg viewBox="0 0 24 24"><path d="M12 3c3 3.5 5 6.2 5 9.5A5 5 0 0 1 12 17.5 5 5 0 0 1 7 12.5C7 9.2 9 6.5 12 3z"/><path d="M12 21v-3.5"/></svg>';
    color = 'var(--ok)';
    title = 'این تب از شبکه تور عبور می‌کند';
  } else if (!u) {
    svg = '';
  } else if (u.startsWith('https')) {
    svg = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    color = 'var(--ok)';
    title = 'اتصال امن (HTTPS)';
  } else {
    svg = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.7-1.5"/></svg>';
    color = 'var(--warn)';
    title = 'اتصال ناامن (HTTP)';
  }
  el.secIcon.innerHTML = svg;
  el.secIcon.style.color = color;
  el.secIcon.title = title;
}

function syncToolbar() {
  const tab = activeTab();
  const has = !!(tab && tab.view);
  el.back.disabled = !(has && tab.view.canGoBack());
  el.fwd.disabled = !(has && tab.view.canGoForward());
  el.reload.disabled = !has;
  el.find.disabled = !has;
  if (has) {
    el.omniWrap.style.display = '';
    syncOmnibox();
  } else {
    el.omnibox.value = '';
    updateSecIcon({ url: '', tor: tab?.tor });
  }
}

function hideMenus() {
  el.suggest.hidden = true;
  el.engineMenu.hidden = true;
  el.ctxmenu.hidden = true;
  el.shieldMenu.hidden = true;
}

function buildSuggestions(q) {
  q = q.trim();
  const rows = [];
  if (looksLikeUrl(q)) {
    rows.push({ label: normalizeUrl(q), hint: 'رفتن به نشانی', color: 'var(--ok)', act: () => navigate(activeTab(), normalizeUrl(q)) });
  }
  const bang = q.match(/^!([a-z]{0,3})\s*(.*)$/i);
  if (bang && bang[1] !== undefined && q.startsWith('!')) {
    const partial = bang[1].toLowerCase();
    const rest = bang[2].trim();
    for (const e of ENGINES.filter(e => e.key.startsWith(partial)).slice(0, 5)) {
      rows.push({
        label: rest ? `!${e.key} ${rest}` : `!${e.key}`,
        hint: `جستجو با ${e.name}`,
        color: e.color,
        act: rest ? () => navigate(activeTab(), `!${e.key} ${rest}`) : null,
        fill: `!${e.key} `
      });
    }
  }
  if (q && !q.startsWith('!')) {
    for (const e of ENGINES.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3)) {
      rows.push({ label: `«${q}» در ${e.name}`, hint: `!${e.key}`, color: e.color, act: () => navigate(activeTab(), `!${e.key} ${q}`) });
    }
    for (const t of tabs.filter(t => t.title.includes(q) || (t.url || '').includes(q)).slice(0, 3)) {
      rows.push({ label: t.title, hint: 'تب باز', color: 'var(--accent)', act: () => activateTab(t.id) });
    }
  }
  const def = currentEngine();
  if (q) {
    rows.push({
      label: q,
      hint: `جستجو با ${def.name}`,
      color: def.color,
      primary: true,
      act: () => navigate(activeTab(), q)
    });
  }
  return rows.slice(0, 10);
}

let sugSel = -1;
function renderSuggestions() {
  const q = el.omnibox.value;
  const rows = buildSuggestions(q);
  sugSel = rows.length - 1;
  if (!rows.length) { el.suggest.hidden = true; return; }
  el.suggest.innerHTML = '';
  rows.forEach((r, i) => {
    const d = document.createElement('div');
    d.className = 'sug-row' + (i === sugSel ? ' sel' : '');
    d.innerHTML = `<span class="sug-dot" style="--eng-color:${r.color};background:${r.color}"></span><span class="sug-label">${escapeHtml(r.label)}</span><span class="sug-hint">${r.hint}</span>`;
    d.addEventListener('click', () => { if (r.act) r.act(); el.suggest.hidden = true; el.omnibox.blur(); });
    d.addEventListener('mousemove', () => { sugSel = i; highlightRows(rows); });
    el.suggest.appendChild(d);
  });
  el.suggest._rows = rows;
  el.suggest.hidden = false;
}

function highlightRows() {
  [...el.suggest.children].forEach((c, i) => c.classList.toggle('sel', i === sugSel));
  const sel = el.suggest.children[sugSel];
  if (sel && el.suggest._rows[sugSel]?.fill) el.omnibox.value = el.suggest._rows[sugSel].fill;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderEngineMenu(anchorWrap) {
  el.engineMenu.style.cssText = '';
  el.engineMenu.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'eng-grid';
  for (const e of ENGINES) {
    const b = document.createElement('button');
    b.className = 'sug-row sug-dot-item eng-item';
    b.innerHTML = `<span class="sug-dot" style="background:${e.color}"></span><span class="sug-label">${e.name}</span>${e.key === PREFS.defaultEngine ? '<span class="sug-hint">✓</span>' : ''}`;
    b.addEventListener('click', async () => {
      await savePrefs({ defaultEngine: e.key });
      renderEngineChip();
      el.engineMenu.hidden = true;
      toast(`موتور پیش‌فرض: ${e.name}`, 1800);
    });
    grid.appendChild(b);
  }
  el.engineMenu.appendChild(grid);
  el.engineMenu.hidden = false;
}

function showCtxMenu(params, wv) {
  const m = el.ctxmenu;
  m.innerHTML = '';
  const add = (label, fn, opts = {}) => {
    const b = document.createElement('button');
    b.className = 'menu-item' + (opts.danger ? ' danger-text' : '');
    b.innerHTML = label + (opts.key ? `<span class="menu-key">${opts.key}</span>` : '');
    if (opts.disabled) b.disabled = true;
    else b.addEventListener('click', () => { m.hidden = true; fn(); });
    m.appendChild(b);
  };
  add('↩ عقب', () => wv.goBack(), { disabled: !wv.canGoBack() });
  add('↪ جلو', () => wv.goForward(), { disabled: !wv.canGoForward() });
  add('⟳ بارگذاری مجدد', () => wv.reload());
  m.insertAdjacentHTML('beforeend', '<div class="menu-sep"></div>');
  if (params.linkURL) {
    add('باز کردن پیوند در تب جدید', () => createTab({ url: params.linkURL }));
    add('🧅 باز کردن پیوند در تب تور', async () => {
      if (torState !== 'on') {
        torStartingFlag = true;
        setTorUI('starting', '');
        await window.onyx.torStart();
        torStartingFlag = false;
      }
      createTab({ url: params.linkURL, tor: true });
    });
    add('کپی نشانی پیوند', () => navigator.clipboard.writeText(params.linkURL));
    m.insertAdjacentHTML('beforeend', '<div class="menu-sep"></div>');
  }
  if (params.srcURL && params.mediaType === 'image') {
    add('باز کردن تصویر در تب جدید', () => createTab({ url: params.srcURL }));
    add('کپی نشانی تصویر', () => navigator.clipboard.writeText(params.srcURL));
    m.insertAdjacentHTML('beforeend', '<div class="menu-sep"></div>');
  }
  if (params.selectionText) {
    add(`جستجوی «${params.selectionText.slice(0, 18)}…»`.slice(0, 42), () => {
      const tab = createTab({});
      setTimeout(() => navigate(tab, `!${currentEngine().key} ${params.selectionText}`), 50);
    });
    add('کپی', () => wv.copy(), { disabled: !params.editFlags.canCopy });
  } else {
    add('کپی', () => wv.copy(), { disabled: !params.editFlags.canCopy });
    add('چسباندن', () => wv.paste(), { disabled: !params.editFlags.canPaste });
  }
  m.insertAdjacentHTML('beforeend', '<div class="menu-sep"></div>');
  add('بررسی عنصر', () => { try { wv.inspectElement(params.x, params.y); } catch {} });

  m.hidden = false;
  const mw = m.offsetWidth || 220;
  const mh = m.offsetHeight || 240;
  const px = Math.min(params.x, innerWidth - mw - 12);
  const py = Math.min(params.y, innerHeight - mh - 12);
  m.style.left = Math.max(8, px) + 'px';
  m.style.top = Math.max(8, py) + 'px';
}

function duplicateTab(tab) {
  createTab({ url: tab.url || undefined, tor: tab.tor });
}

function closeTabsExcept(id, opts = {}) {
  const idx = tabs.findIndex(t => t.id === id);
  tabs.filter((t, i) => {
    if (t.id === id) return false;
    if (opts.right && i <= idx) return false;
    return true;
  }).forEach(t => closeTab(t.id));
}

function showTabMenu(tab, ev) {
  const m = el.ctxmenu;
  m.innerHTML = '';
  const add = (label, fn, o = {}) => {
    const b = document.createElement('button');
    b.className = 'menu-item' + (o.danger ? ' danger-text' : '');
    b.innerHTML = label + (o.key ? `<span class="menu-key">${o.key}</span>` : '');
    if (o.disabled) b.disabled = true;
    else b.addEventListener('click', () => { m.hidden = true; fn(); });
    m.appendChild(b);
  };
  add('بستن تب', () => closeTab(tab.id), { key: 'Ctrl+W' });
  add('تکرار تب', () => duplicateTab(tab));
  add('بارگذاری مجدد', () => { if (tab.view) tab.view.reload(); });
  m.insertAdjacentHTML('beforeend', '<div class="menu-sep"></div>');
  add('بستن سایر تب‌ها', () => closeTabsExcept(tab.id));
  add('بستن تب‌های سمت راست', () => closeTabsExcept(tab.id, { right: true }));
  if (tab.url) add('کپی نشانی', () => navigator.clipboard.writeText(tab.url));
  m.style.left = Math.min(ev.clientX, innerWidth - 230) + 'px';
  m.style.top = Math.max(8, Math.min(ev.clientY, innerHeight - m.offsetHeight - 12)) + 'px';
  m.hidden = false;
}

async function startTorFlow(autoTab) {
  if (torState === 'on') return true;
  torStartingFlag = true;
  setTorUI('starting', 'در حال اتصال به تور…');
  const res = await window.onyx.torStart();
  torStartingFlag = false;
  setTorUI(res.status, res.detail);
  if (res.status !== 'on') {
    toast(res.status === 'error' ? 'خطا در اتصال به تور' : 'تور متصل نشد', 4000);
    return false;
  }
  refreshTorInfo();
  return true;
}

function setTorUI(status, detail) {
  torState = status;
  el.torDot.className = status === 'on' ? 'on' : status === 'starting' ? 'starting' : status === 'error' ? 'error' : '';
  el.torDot.id = 'torDot';
  const map = {
    off: 'تور خاموش',
    starting: 'در حال اتصال به تور…',
    on: 'تور متصل ✓',
    error: 'خطای تور'
  };
  el.torPillText.textContent = detail || map[status] || map.off;
  el.torPill.classList.toggle('on', status === 'on');
  el.torPill.hidden = false;
  const stTxt = $('#torStatusText');
  if (stTxt) stTxt.textContent = map[status] + (detail && status === 'error' ? ` — ${detail}` : '');
  const btn = $('#btnTorToggle');
  if (btn) btn.textContent = status === 'on' || status === 'starting' ? 'قطع اتصال تور' : 'اتصال به تور';
}

async function refreshTorInfo() {
  const info = await window.onyx.torInfo();
  torInfoCache = info;
  const box = $('#torInfoBox');
  if (!box) return;
  if (info && info.IsTor) {
    box.hidden = false;
    box.textContent = `IP خروجی: ${info.IP}\nکشور: ${info.Country || '—'} (${info.CountryCode || '—'})`;
  } else if (info && info.Error) {
    box.hidden = false;
    box.textContent = 'خطا: ' + info.Error;
  } else {
    box.hidden = true;
  }
}

async function newTorTab() {
  const ok = torState === 'on' ? true : await startTorFlow(true);
  if (ok) createTab({ tor: true });
}

function openSettings(open) {
  const panel = $('#settings');
  panel.hidden = !open;
  if (open) hydrateSettings();
}

function hydrateSettings() {
  $('#setTheme').value = PREFS.theme;
  $('#setAccent').value = PREFS.accent;
  $('#setFont').value = PREFS.fontSize;
  $('#setAnim').checked = PREFS.animations;
  $('#setBg').value = PREFS.bgStyle;
  $('#setAdblock').checked = PREFS.adblock;
  $('#setDnt').checked = PREFS.dnt;
  $('#setReferer').checked = PREFS.stripReferer;
  $('#setWebrtc').checked = PREFS.blockWebRtc;
  $('#setHttps').checked = PREFS.httpsUpgrade;
  const v = $('#appVersion'); if (v) v.textContent = 'نسخه ' + (PREFS.appVersion || '1.0.0');
  $('#setSavePrefs').checked = PREFS.savePrefs;
  $('#setHome').value = PREFS.homepage || '';
  $('#setTorPort').value = PREFS.torPort;
  $('#qkAdblock').checked = PREFS.adblock;
  $('#qkDnt').checked = PREFS.dnt;
  const sel = $('#setEngine');
  if (!sel.options.length) {
    for (const e of ENGINES) {
      const o = document.createElement('option');
      o.value = e.key;
      o.textContent = e.name;
      sel.appendChild(o);
    }
  }
  sel.value = PREFS.defaultEngine;
  const sw = $('#accentSwatches');
  if (!sw.children.length) {
    for (const c of ['#7c5cff', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#ff5470', '#a3e635']) {
      const s = document.createElement('span');
      s.className = 'swatch';
      s.style.background = c;
      s.dataset.c = c;
      s.addEventListener('click', async () => {
        await savePrefs({ accent: c });
        applyTheme();
        markSwatch(c);
      });
      sw.appendChild(s);
    }
  }
  markSwatch(PREFS.accent);
}

function markSwatch(c) {
  $$('#accentSwatches .swatch').forEach(s => s.classList.toggle('sel', s.dataset.c.toLowerCase() === (c || '').toLowerCase()));
}

function renderTiles() {
  el.tiles.innerHTML = '';
  const tiles = [...DEFAULT_TILES, ...(PREFS.tiles || [])];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    const d = document.createElement('div');
    d.className = 'tile';
    d.innerHTML = `
      ${i >= DEFAULT_TILES.length ? '<button class="tile-del">×</button>' : ''}
      <div class="tile-logo" style="${t.color ? `--tcolor:${t.color}` : ''}">${escapeHtml((t.name || '?')[0] || '?')}</div>
      <span class="tile-name">${escapeHtml(t.name)}</span>`;
    d.addEventListener('click', ev => {
      if (ev.target.classList.contains('tile-del')) {
        savePrefs({ tiles: (PREFS.tiles || []).filter(x => x.name !== t.name) }).then(renderTiles);
        return;
      }
      navigate(activeTab(), t.url);
    });
    el.tiles.appendChild(d);
  }
  const add = document.createElement('div');
  add.className = 'tile tile-add';
  add.innerHTML = `<div class="tile-logo">+</div><span class="tile-name">افزودن</span>`;
  add.addEventListener('click', () => {
    const name = prompt('نام میان‌بر:');
    if (!name) return;
    const url = prompt('نشانی:', 'https://');
    if (!url) return;
    savePrefs({ tiles: [...(PREFS.tiles || []), { name, url }] }).then(renderTiles);
  });
  el.tiles.appendChild(add);
}

function tickClock() {
  const now = new Date();
  try {
    el.clock.textContent = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    el.dateLine.textContent = now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    el.clock.textContent = now.toTimeString().slice(0, 5);
  }
  const h = now.getHours();
  el.greet.textContent = h < 5 ? 'شب‌زنده‌داری بخیر 🌌'
    : h < 12 ? 'صبح بخیر ☀️'
    : h < 15 ? 'ظهر بخیر 🌤'
    : h < 19 ? 'عصر بخیر 🌇'
    : 'شب بخیر 🌙';
}

function doFind(next) {
  const tab = activeTab();
  if (!tab || !tab.view || !el.findInput.value) return;
  tab.view.findInPage(el.findInput.value, next ? { findNext: true } : undefined);
}

function zoom(delta) {
  const tab = activeTab();
  if (!tab || !tab.view) return;
  try {
    let z = tab.view.getZoomLevel();
    z = delta === 0 ? 0 : Math.max(-6, Math.min(6, z + delta));
    tab.view.setZoomLevel(z);
    if (el.zoomBtn) el.zoomBtn.textContent = Math.round(Math.pow(1.2, z) * 100) + '%';
  } catch {}
}

el.newTab.addEventListener('click', () => createTab({}));
el.btnTor.addEventListener('click', newTorTab);
el.back.addEventListener('click', () => { const t = activeTab(); if (t?.view) t.view.goBack(); });
el.fwd.addEventListener('click', () => { const t = activeTab(); if (t?.view) t.view.goForward(); });
el.reload.addEventListener('click', () => { const t = activeTab(); if (t?.view) t.view.reload(); });
el.homeBtn.addEventListener('click', () => navigate(activeTab(), '', { forceHome: true }));

el.omnibox.addEventListener('focus', () => { el.omnibox.select(); renderSuggestions(); });
el.omnibox.addEventListener('input', renderSuggestions);
el.omnibox.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const rows = el.suggest._rows || [];
    const row = rows[sugSel];
    el.suggest.hidden = true;
    el.omnibox.blur();
    if (row && row.act) row.act();
    else navigate(activeTab(), el.omnibox.value);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const n = el.suggest.children.length;
    if (n) { sugSel = (sugSel + 1) % n; highlightRows(); }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const n = el.suggest.children.length;
    if (n) { sugSel = (sugSel - 1 + n) % n; highlightRows(); }
  } else if (e.key === 'Escape') {
    el.suggest.hidden = true;
    el.omnibox.blur();
    syncOmnibox();
  }
});
el.omnibox.addEventListener('blur', () => setTimeout(() => { el.suggest.hidden = true; }, 150));

el.engineChip.addEventListener('click', e => {
  e.stopPropagation();
  if (el.engineMenu.hidden) renderEngineMenu();
  else el.engineMenu.hidden = true;
});
document.addEventListener('click', e => {
  if (!el.engineMenu.hidden && !el.engineMenu.contains(e.target) && e.target !== el.engineChip) el.engineMenu.hidden = true;
});

el.homeGo.addEventListener('click', () => {
  const v = el.homeSearch.value.trim();
  if (v) navigate(activeTab(), v);
});
el.homeSearch.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const v = el.homeSearch.value.trim();
    if (v) { el.homeSearch.value = ''; navigate(activeTab(), v); }
  }
});
el.homeEngineChip.addEventListener('click', e => {
  e.stopPropagation();
  const r = el.homeEngineChip.getBoundingClientRect();
  renderEngineMenu();
  el.engineMenu.style.top = (r.bottom + 8) + 'px';
  el.engineMenu.style.right = 'auto';
  el.engineMenu.style.left = Math.max(8, r.left - 200) + 'px';
  el.engineMenu.style.maxWidth = 'min(460px,90vw)';
});

el.wcMin.addEventListener('click', () => window.onyx.min());
el.wcMax.addEventListener('click', () => window.onyx.maxToggle());
el.wcClose.addEventListener('click', () => window.onyx.close());
$('#tabbar').addEventListener('dblclick', e => {
  if (e.target === $('#drag-space')) window.onyx.maxToggle();
});

el.settingsBtn.addEventListener('click', () => openSettings($('#settings').hidden));
$('#settingsClose').addEventListener('click', () => openSettings(false));
$('#settings').addEventListener('click', e => { if (e.target.id === 'settings') openSettings(false); });

$('#setTheme').addEventListener('change', async e => { await savePrefs({ theme: e.target.value }); applyTheme(); });
$('#setAccent').addEventListener('input', async e => { await savePrefs({ accent: e.target.value }); applyTheme(); });
$('#setFont').addEventListener('input', async e => { await savePrefs({ fontSize: +e.target.value }); applyTheme(); });
$('#setAnim').addEventListener('change', async e => { await savePrefs({ animations: e.target.checked }); applyTheme(); });
$('#setBg').addEventListener('change', async e => { await savePrefs({ bgStyle: e.target.value }); applyTheme(); });
$('#setAdblock').addEventListener('change', async e => { await savePrefs({ adblock: e.target.checked }); $('#qkAdblock').checked = e.target.checked; });
$('#setDnt').addEventListener('change', async e => { await savePrefs({ dnt: e.target.checked }); $('#qkDnt').checked = e.target.checked; });
$('#setReferer').addEventListener('change', async e => { await savePrefs({ stripReferer: e.target.checked }); });
$('#setWebrtc').addEventListener('change', async e => {
  await savePrefs({ blockWebRtc: e.target.checked });
  toast('برای اعمال تغییر WebRTC، برنامه را یک‌بار راه‌اندازی مجدد کنید', 5000);
});
$('#setHttps').addEventListener('change', async e => { await savePrefs({ httpsUpgrade: e.target.checked }); });
$('#setSavePrefs').addEventListener('change', async e => {
  await savePrefs({ savePrefs: e.target.checked });
  toast(e.target.checked ? 'تنظیمات روی دیسک ذخیره می‌شود (فقط تنظیمات)' : 'ذخیره‌سازی غیرفعال شد — هیچ چیزی روی دیسک نمی‌ماند');
});
$('#setEngine').addEventListener('change', async e => { await savePrefs({ defaultEngine: e.target.value }); renderEngineChip(); });
$('#setHome').addEventListener('change', async e => { await savePrefs({ homepage: e.target.value.trim() }); });
$('#setTorPort').addEventListener('change', async e => { await savePrefs({ torPort: +e.target.value || 9050 }); });

$('#btnTorToggle').addEventListener('click', async () => {
  if (torState === 'on' || torState === 'starting') {
    const res = await window.onyx.torStop();
    setTorUI(res.status, '');
    torInfoCache = null;
    $('#torInfoBox').hidden = true;
    toast('تور قطع شد');
  } else {
    await startTorFlow();
  }
});

async function wipeNow() {
  await window.onyx.wipe();
  toast('همه داده‌ها پاک شد — مثل اینکه هیچ‌وقت نبودی 👻', 4200);
}
$('#btnWipe').addEventListener('click', wipeNow);
$('#qkWipe').addEventListener('click', () => { el.shieldMenu.hidden = true; wipeNow(); });
$('#qkAdblock').addEventListener('change', async e => { await savePrefs({ adblock: e.target.checked }); hydrateSettings(); });
$('#qkDnt').addEventListener('change', async e => { await savePrefs({ dnt: e.target.checked }); hydrateSettings(); });

el.shield.addEventListener('click', e => {
  e.stopPropagation();
  const m = el.shieldMenu;
  const r = el.shield.getBoundingClientRect();
  m.style.left = Math.max(8, r.left - 160) + 'px';
  m.style.top = (r.bottom + 8) + 'px';
  $('#qkAdblock').checked = PREFS.adblock;
  $('#qkDnt').checked = PREFS.dnt;
  m.hidden = !m.hidden;
});
document.addEventListener('click', e => {
  if (!el.shieldMenu.hidden && !el.shieldMenu.contains(e.target) && e.target !== el.shield) el.shieldMenu.hidden = true;
  if (!el.ctxmenu.hidden && !el.ctxmenu.contains(e.target)) el.ctxmenu.hidden = true;
});

el.find.addEventListener('click', () => {
  el.findbar.hidden = !el.findbar.hidden;
  if (!el.findbar.hidden) el.findInput.focus();
});
$('#findClose').addEventListener('click', () => {
  el.findbar.hidden = true;
  const t = activeTab();
  if (t?.view) t.view.stopFindInPage('clearSelection');
});
$('#findNext').addEventListener('click', () => doFind(true));
$('#findPrev').addEventListener('click', () => doFind(true));
el.findInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') doFind(!e.shiftKey);
  if (e.key === 'Escape') $('#findClose').click();
});
el.findInput.addEventListener('input', () => doFind(false));

document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.shiftKey && (e.key === 'T' || e.key === 't')) { e.preventDefault(); newTorTab(); return; }
  if (mod && (e.key === 'T' || e.key === 't')) { e.preventDefault(); createTab({}); return; }
  if (mod && (e.key === 'W' || e.key === 'w')) { e.preventDefault(); closeTab(activeId); return; }
  if (mod && (e.key === 'L' || e.key === 'l' || e.key === 'K' || e.key === 'k')) { e.preventDefault(); el.omnibox.focus(); return; }
  if (mod && e.key === 'Tab') {
    e.preventDefault();
    const idx = tabs.findIndex(t => t.id === activeId);
    activateTab(tabs[(idx + (e.shiftKey ? -1 : 1) + tabs.length) % tabs.length].id);
    return;
  }
  if (mod && /^[1-9]$/.test(e.key)) {
    e.preventDefault();
    const t = tabs[+e.key - 1] || tabs[tabs.length - 1];
    if (t) activateTab(t.id);
    return;
  }
  if (mod && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); el.findbar.hidden = false; el.findInput.focus(); return; }
  if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoom(0.5); return; }
  if (mod && e.key === '-') { e.preventDefault(); zoom(-0.5); return; }
  if (mod && e.key === '0') { e.preventDefault(); zoom(0); return; }
  if ((mod && (e.key === 'R' || e.key === 'r')) || e.key === 'F5') {
    e.preventDefault();
    const t = activeTab();
    if (t?.view) t.view.reload();
    return;
  }
  if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); const t = activeTab(); if (t?.view) t.view.goForward(); return; }
  if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); const t = activeTab(); if (t?.view) t.view.goBack(); return; }
  if (e.key === 'F11') { window.onyx.fullscreen(!document.fullscreenElement); return; }
  if (e.key === 'Escape') {
    hideMenus();
    openSettings(false);
    if (!$('#findbar').hidden) $('#findClose').click();
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  PREFS = await window.onyx.getPrefs();
  applyTheme();
  renderEngineChip();
  renderTiles();
  tickClock();
  setInterval(tickClock, 1000);
  setTorUI('off', '');
  const st = await window.onyx.torStatus();
  setTorUI(st.status, st.detail);
  if (st.status === 'on') refreshTorInfo();

  createTab({});
  if (PREFS.homepage) {
    const t = tabs[0];
    await navigate(t, PREFS.homepage);
  }
  setTimeout(() => el.homeSearch.focus(), 120);
});

window.onyx.onTorStatus(({ status, detail }) => {
  setTorUI(status, detail);
  if (status === 'on') refreshTorInfo();
});

window.onyx.onToast(t => {
  if (t.kind === 'dl-done') toast(`دانلود کامل شد: ${t.file}`, 4000);
  else if (t.kind === 'dl-progress') toast(`در حال دانلود ${t.file} — ${fmtBytes(t.received)}${t.total ? ' از ' + fmtBytes(t.total) : ''}`, 1500);
  else if (t.kind === 'dl-fail') toast(`دانلود ناموفق: ${t.file}`, 4000);
  else if (t.kind === 'update') toast(t.file || 'نسخه جدید در دسترس است', 5000);
});

window.onyx.onWinMax(m => el.wcMax.classList.toggle('maxed', m));
