const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: () => ipcRenderer.invoke('print-receipt'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  saveLicense: (licenseData) => ipcRenderer.invoke('save-license', licenseData),
  loadLicense: () => ipcRenderer.invoke('load-license'),
  clearLicense: () => ipcRenderer.invoke('clear-license'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  closeApp: () => ipcRenderer.invoke('close-app'),
});

