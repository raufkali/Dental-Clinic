const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: () => ipcRenderer.invoke('print-receipt'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
