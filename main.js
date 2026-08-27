'use strict';
const { app, BrowserWindow, ipcMain, session, net } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const netmod = require('net');

let mainWin = null;

const CONFIG_DIR = path.join(os.homedir(), '.config', 'onyx-browser');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

const DEFAULT_PREFS = {
  savePrefs: false,
  theme: 'midnight',
  accent: '#7c5cff',
  fontSize: 14,
  animations: true,
  bgStyle: 'aurora',
  defaultEngine: 'd',
  homepage: '',
  adblock: true,
  dnt: true,
  stripReferer: true,
  blockWebRtc: true,
  httpsUpgrade: false,
  torEnabled: false,
  torPort: 9050,
  windowBounds: null,
  tiles: []
};

let prefs = { ...DEFAULT_PREFS };
try {
  Object.assign(prefs, JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')));
} catch {}
if (!prefs.savePrefs) {
  try { fs.rmSync(SETTINGS_FILE, { force: true }); } catch {}
}

try {
  const vol = path.join(os.tmpdir(), 'onyx-volatile', String(process.pid));
  fs.mkdirSync(vol, { recursive: true });
  app.setPath('userData', vol);
} catch {}

app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication,Translate,MediaRouter,BackgroundFetch,WebBluetooth,WebUSB,WebHID,WebPrinting,ComputePressure');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
// Privacy: never leak the local IP via WebRTC unless the user opts out.
if (prefs.blockWebRtc) app.commandLine.appendSwitch('disable-webrtc');

const GENERIC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const STORAGES = ['cookies', 'cache', 'codecache', 'cachestorage', 'localstorage', 'indexdb', 'filesystem', 'websql', 'serviceworkers', 'shadercache', 'dictionarydata'];

const BLOCKLIST = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'google-analytics.com',
  'googletagmanager.com', 'adservice.google.com', 'pagead2.googlesyndication.com', 'admob.com',
  'scorecardresearch.com', 'quantserve.com', 'quantcast.com', 'moatads.com', 'adsafeprotected.com',
  'hotjar.com', 'mixpanel.com', 'segment.io', 'segment.com', 'amplitude.com', 'chartbeat.com',
  'kissmetrics.com', 'mouseflow.com', 'fullstory.com', 'crazyegg.com', 'luckyorange.com',
  'clicktale.net', 'inspectlet.com', 'heatmap.me', 'taboola.com', 'outbrain.com', 'mgid.com',
  'revcontent.com', 'content-ad.net', 'zedo.com', 'popads.net', 'popcash.net', 'propellerads.com',
  'adcash.com', 'exoclick.com', 'juicyads.com', 'trafficjunky.com', 'trafficfactory.biz',
  'criteo.com', 'criteo.net', 'casalemedia.com', 'rubiconproject.com', 'pubmatic.com',
  'adnxs.com', 'openx.net', 'smartadserver.com', 'spotxchange.com', 'teads.tv', 'sharethrough.com',
  'yieldmo.com', '33across.com', 'bidswitch.net', 'indexww.com', 'districtm.io', 'gumgum.com',
  'media.net', 'mediaalpha.com', 'adform.net', 'adroll.com', 'sitescout.com', 'buysellads.com',
  'branch.io', 'appsflyer.com', 'adjust.com', 'kochava.com', 'singular.net', 'tenjin.io',
  'facebook.net', 'connect.facebook.net', 'graph.facebook.com', 'analytics.tiktok.com',
  'ads.linkedin.com', 'px.ads.linkedin.com', 'bat.bing.com', 'clarity.ms', 'snap.licdn.com',
  'tr.snapchat.com', 'events.reddit.com', 'ads.reddit.com', 'static.ads-twitter.com',
  'cdn.onesignal.com', 'onesignal.com', 'pushwoosh.com', 'pusher.com', 'intercom.io',
  'crisp.chat', 'drift.com', 'livechatinc.com', 'zdassets.com', 'zendesk.com', 'usabilla.com',
  'optimizely.com', 'vwo.com', 'abtasty.com', 'convert.com', 'crazyegg.net', 'matomo.cloud',
  'stats.wp.com', 'pixel.wp.com', 'newrelic.com', 'nr-data.net', 'bugsnag.com', 'logrocket.com',
  'smartlook.com', 'userreport.com', 'survicate.com', 'qualaroo.com', 'polldaddy.com'
];

function hostBlocked(h) {
  h = (h || '').toLowerCase();
  return BLOCKLIST.some(d => h === d || h.endsWith('.' + d));
}

// Substring / path patterns that slip past a host-only blocklist.
const BLOCK_PATTERNS = [
  /[?&](__a|__adi|_ga|_gid|_gat|fbclid|gclid|mc_eid|mkt_tok|igshid|utm_)[=]/i,
  /(\/|\.)(pixel|beacon|track(er|ing)?|analytics|telemetry|collect|impression|tag\/|sponsor)\b/i,
  /\b(doubleclick|adservice|adnxs|rubiconproject|criteo|pubmatic|taboola|outbrain)\b/i
];

function urlBlocked(u) {
  let host = '';
  try { host = new URL(u).hostname; } catch {}
  if (host && hostBlocked(host)) return true;
  return BLOCK_PATTERNS.some(p => p.test(u));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

class Tor {
  constructor() {
    this.status = 'off';
    this.detail = '';
    this.proc = null;
    this.mine = false;
    this.external = false;
  }
  emit() {
    send('tor:status', { status: this.status, detail: this.detail });
  }
  set(status, detail = '') {
    this.status = status;
    this.detail = detail;
    this.emit();
  }
  portOpen(port) {
    return new Promise(res => {
      const s = netmod.connect({ host: '127.0.0.1', port }, () => { s.destroy(); res(true); });
      s.on('error', () => res(false));
      s.setTimeout(800, () => { s.destroy(); res(false); });
    });
  }
  async start() {
    if (this.status === 'on' || this.status === 'starting') return;
    const port = prefs.torPort | 0 || 9050;
    this.set('starting', 'در حال اتصال به شبکه تور…');
    if (await this.portOpen(port)) {
      this.mine = false;
      this.external = true;
      this.set('on');
      return;
    }
    this.external = false;
    const dataDir = path.join(os.tmpdir(), 'onyx-tor-data');
    try { fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 }); } catch {}
    try {
      this.proc = spawn('tor', [
        '--SocksPort', String(port),
        '--DataDirectory', dataDir,
        '--ControlPort', 'auto',
        '--CookieAuthentication', '0'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      this.set('error', 'اجر tor ممکن نشد: ' + e.message);
      return;
    }
    this.mine = true;
    let waited = 0;
    while (waited < 45000) {
      await sleep(600);
      waited += 600;
      if (await this.portOpen(port)) { this.set('on'); return; }
      if (this.proc.exitCode !== null) break;
    }
    if (this.status !== 'on') this.set('error', 'تور پاسخ نداد (پورت ' + port + ')');
  }
  stop() {
    if (this.proc && this.mine) {
      try { this.proc.kill('SIGTERM'); } catch {}
      const p = this.proc;
      setTimeout(() => { try { p.kill('SIGKILL'); } catch {} }, 3000);
    } else if (this.external && this.status === 'on') {
      this.set('off');
      return;
    }
    this.proc = null;
    this.mine = false;
    this.external = false;
    this.set('off');
  }
}

const tor = new Tor();

let clearSes = null;
let torSes = null;

function send(ch, payload) {
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send(ch, payload);
}

function applyAdblock() {
  for (const ses of [clearSes, torSes]) {
    const f = { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] };
    ses.webRequest.onBeforeRequest(f, (d, cb) => {
      if (!prefs.adblock) return cb({ cancel: false });
      try { cb({ cancel: urlBlocked(d.url) }); }
      catch { cb({ cancel: false }); }
    });
  }
}

// Header privacy: DNT/GPC signalling + strip third-party Referer and
// X-Requested-With leakage. Reads live prefs so toggles apply without restart.
function applyHeaderPrivacy() {
  for (const ses of [clearSes, torSes]) {
    const f = { urls: ['http://*/*', 'https://*/*'] };
    ses.webRequest.onBeforeSendHeaders(f, (d, cb) => {
      const h = d.requestHeaders;
      const firstParty = (() => {
        try { return new URL(d.url).hostname === new URL(d.referrer || '').hostname; } catch { return false; }
      })();
      if (prefs.dnt) { h['DNT'] = '1'; h['Sec-GPC'] = '1'; }
      else { delete h['DNT']; delete h['Sec-GPC']; }
      if (prefs.stripReferer && !firstParty) delete h['Referer'];
      if (prefs.stripReferer) delete h['X-Requested-With'];
      cb({ requestHeaders: h });
    });
  }
}

// Best-effort HTTPS upgrade for plain-text requests (opt-in).
function applyHttpsUpgrade() {
  for (const ses of [clearSes, torSes]) {
    const f = { urls: ['http://*/*'] };
    ses.webRequest.onBeforeRequest(f, (d, cb) => {
      if (!prefs.httpsUpgrade) return cb({ cancel: false });
      if (!['mainFrame', 'subFrame', 'stylesheet', 'script', 'image', 'font', 'xhr', 'fetch'].includes(d.resourceType)) return cb({ cancel: false });
      try {
        const u = new URL(d.url);
        if (u.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) {
          u.protocol = 'https:';
          return cb({ redirectURL: u.toString() });
        }
      } catch {}
      cb({ cancel: false });
    });
  }
}

async function syncTorProxy() {
  try {
    if (prefs.torEnabled) {
      await torSes.setProxy({
        mode: 'fixed_servers',
        proxyRules: `socks5://127.0.0.1:${prefs.torPort | 0 || 9050}`,
        proxyBypassRules: '<local>'
      });
    } else {
      await torSes.setProxy({ mode: 'direct' });
    }
  } catch {}
}

function harden(ses) {
  ses.setUserAgent(GENERIC_UA);
  ses.setPermissionRequestHandler((wc, permission, cb) => {
    cb(['fullscreen', 'pointerLock', 'clipboard-sanitized-write', 'media'].includes(permission));
  });
  ses.setPermissionCheckHandler((wc, permission) =>
    ['fullscreen', 'pointerLock', 'media'].includes(permission)
  );
  ses.on('will-download', (e, item) => {
    const dir = path.join(os.homedir(), 'Downloads');
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    const name = item.getFilename();
    let target = path.join(dir, name);
    let i = 1;
    while (fs.existsSync(target)) {
      const ext = path.extname(name);
      target = path.join(dir, `${path.basename(name, ext)} (${i++})${ext}`);
    }
    item.setSavePath(target);
    item.on('updated', (_, st) => {
      send('toast', { kind: 'dl-progress', file: item.getFilename(), received: st.receivedBytes, total: st.totalBytes });
    });
    item.once('done', (_, st) => {
      send('toast', { kind: st.state === 'completed' ? 'dl-done' : 'dl-fail', file: item.getFilename(), path: target });
    });
  });
  return ses;
}

async function wipeAll() {
  await Promise.allSettled(
    [clearSes, torSes].filter(Boolean).map(s => s.clearStorageData({ storages: STORAGES }))
  );
}

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 920,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#05070d',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      spellcheck: false
    }
  });
  mainWin.setMenuBarVisibility(false);

  if (prefs.savePrefs && prefs.windowBounds) {
    try {
      const b = prefs.windowBounds;
      if (b && b.width && b.height) {
        mainWin.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height }, false);
        if (b.maximized) mainWin.maximize();
      }
    } catch {}
  }

  const persistBounds = () => {
    if (!prefs.savePrefs) return;
    try {
      const b = mainWin.getBounds();
      b.maximized = mainWin.isMaximized();
      prefs.windowBounds = b;
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(prefs, null, 2));
    } catch {}
  };
  mainWin.on('resize', persistBounds);
  mainWin.on('move', persistBounds);

  mainWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWin.once('ready-to-show', () => mainWin.show());
  const maxState = () => send('win:max', mainWin.isMaximized());
  mainWin.on('maximize', maxState);
  mainWin.on('unmaximize', maxState);
}

ipcMain.handle('prefs:get', () => ({ ...prefs, appVersion: app.getVersion() }));

ipcMain.handle('prefs:set', (e, patch) => {
  const oldTorEnabled = prefs.torEnabled;
  const oldTorPort = prefs.torPort;
  Object.assign(prefs, patch || {});
  if (prefs.savePrefs) {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(prefs, null, 2));
    } catch {}
  } else {
    try { fs.rmSync(SETTINGS_FILE, { force: true }); } catch {}
  }
  applyAdblock();
  applyHeaderPrivacy();
  applyHttpsUpgrade();
  if ((prefs.torPort | 0) !== oldTorPort && tor.status !== 'off') tor.stop();
  syncTorProxy();
  if (prefs.torEnabled && !oldTorEnabled) {
    tor.start().then(() => { if (tor.status === 'on') syncTorProxy(); });
  }
  if (!prefs.torEnabled && oldTorEnabled) tor.stop();
  return prefs;
});

ipcMain.on('win:min', () => { if (mainWin) mainWin.minimize(); });
ipcMain.on('win:maxToggle', () => {
  if (!mainWin) return;
  if (mainWin.isMaximized()) mainWin.unmaximize();
  else mainWin.maximize();
});
ipcMain.on('win:close', () => { if (mainWin) mainWin.close(); });
ipcMain.on('win:fullscreen', (e, on) => { if (mainWin) mainWin.setFullScreen(!!on); });

ipcMain.handle('tor:start', async () => {
  prefs.torEnabled = true;
  await syncTorProxy();
  await tor.start();
  if (tor.status === 'on') await syncTorProxy();
  return { status: tor.status, detail: tor.detail };
});
ipcMain.handle('tor:stop', async () => {
  prefs.torEnabled = false;
  await syncTorProxy();
  tor.stop();
  return { status: tor.status };
});
ipcMain.handle('tor:status', () => ({ status: tor.status, detail: tor.detail }));

ipcMain.handle('tor:info', async () => {
  if (tor.status !== 'on' || !prefs.torEnabled) return { IsTor: false };
  try {
    const r = await net.fetch('https://check.torproject.org/api/ip', { session: torSes });
    return await r.json();
  } catch (err) {
    return { Error: String((err && err.message) || err), IsTor: false };
  }
});

ipcMain.handle('privacy:wipe', async () => {
  await wipeAll();
  return true;
});

let cleaningUp = false;
async function cleanupAndExit() {
  if (cleaningUp) return;
  cleaningUp = true;
  try {
    await Promise.race([wipeAll(), sleep(3000)]);
  } catch {}
  try { tor.stop(); } catch {}
  app.exit(0);
}

app.on('before-quit', (e) => {
  if (cleaningUp) return;
  e.preventDefault();
  cleanupAndExit();
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

app.on('second-instance', () => {
  if (mainWin) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.focus();
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

let autoUpdater = null;
function initAutoUpdater() {
  if (!app.isPackaged) return; // only update installed builds
  try { autoUpdater = require('electron-updater').autoUpdater; }
  catch { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-available', () => send('toast', { kind: 'update', file: 'نسخه جدید در دسترس است — هنگام خروج نصب می‌شود' }));
  autoUpdater.on('error', () => {});
  try { autoUpdater.checkForUpdatesAndNotify().catch(() => {}); } catch {}
}

app.whenReady().then(async () => {
  clearSes = harden(session.fromPartition('onyx-clear'));
  torSes = harden(session.fromPartition('onyx-tor'));
  applyAdblock();
  applyHeaderPrivacy();
  applyHttpsUpgrade();
  await syncTorProxy();
  if (prefs.torEnabled) tor.start().then(() => { if (tor.status === 'on') syncTorProxy(); });
  createWindow();
  initAutoUpdater();
});

app.on('activate', () => {
  if (mainWin) { mainWin.show(); return; }
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
