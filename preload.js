'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('onyx', {
  getPrefs: () => ipcRenderer.invoke('prefs:get'),
  setPrefs: (patch) => ipcRenderer.invoke('prefs:set', patch),
  min: () => ipcRenderer.send('win:min'),
  maxToggle: () => ipcRenderer.send('win:maxToggle'),
  close: () => ipcRenderer.send('win:close'),
  fullscreen: (on) => ipcRenderer.send('win:fullscreen', on),
  torStart: () => ipcRenderer.invoke('tor:start'),
  torStop: () => ipcRenderer.invoke('tor:stop'),
  torStatus: () => ipcRenderer.invoke('tor:status'),
  torInfo: () => ipcRenderer.invoke('tor:info'),
  wipe: () => ipcRenderer.invoke('privacy:wipe'),
  onTorStatus: (cb) => ipcRenderer.on('tor:status', (_, s) => cb(s)),
  onToast: (cb) => ipcRenderer.on('toast', (_, t) => cb(t)),
  onWinMax: (cb) => ipcRenderer.on('win:max', (_, m) => cb(m))
});
