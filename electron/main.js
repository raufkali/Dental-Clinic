const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

let mainWindow;

// Generate deterministic, unforgeable hardware fingerprint
function getHardwareId() {
  try {
    if (process.platform === 'win32') {
      const output = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', {
        encoding: 'utf8',
        timeout: 2000,
        windowsHide: true
      });
      const match = output.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/i);
      if (match && match[1]) {
        const raw = `WIN-${match[1].trim()}`;
        return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 24).toUpperCase();
      }
    }
  } catch (err) {
    console.warn('[HardwareID] Registry MachineGuid query failed, falling back to hardware telemetry:', err.message);
  }

  // Fallback hardware fingerprinting from MAC, CPU and hostname
  const interfaces = os.networkInterfaces();
  let mac = '';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        mac = iface.mac;
        break;
      }
    }
    if (mac) break;
  }

  const rawFallback = `${os.hostname()}-${os.arch()}-${os.cpus()[0]?.model || ''}-${mac}`;
  return crypto.createHash('sha256').update(rawFallback).digest('hex').substring(0, 24).toUpperCase();
}

const getLicenseFilePath = () => path.join(app.getPath('userData'), 'dental_license.json');

// Quick HTTP ping to verify Vite dev server is actually returning HTML
function pingHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function getAvailableDevUrl() {
  const ports = [5173, 5174, 5175];
  for (const port of ports) {
    const isLive = await pingHttp(`http://127.0.0.1:${port}/`);
    if (isLive) {
      console.log(`[Electron] Connected to live Vite dev server on port ${port}`);
      return `http://127.0.0.1:${port}`;
    }
  }
  return null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    title: 'Dental Clinic Management & Accounting',
    show: false
  });

  const distPath = path.join(__dirname, '../client/dist/index.html');

  // Gracefully fallback to local bundle if network load fails
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[Electron] Page failed to load (${validatedURL}): ${errorDescription}. Falling back to local bundle...`);
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    }
  });

  // Attempt to connect to dev server first, or load built dist files
  let devUrl = await getAvailableDevUrl();

  // Retry once if server is still starting up
  if (!devUrl) {
    await new Promise((r) => setTimeout(r, 1200));
    devUrl = await getAvailableDevUrl();
  }

  if (devUrl) {
    console.log(`[Electron] Loading dev server: ${devUrl}`);
    mainWindow.loadURL(devUrl);
  } else {
    console.log(`[Electron] Dev server not active. Loading production bundle: ${distPath}`);
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      console.error('[Electron] Error: Neither dev server nor client/dist/index.html was found.');
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // In case ready-to-show is delayed, ensure window is displayed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 2000);

  // Keyboard shortcuts (F12 to toggle DevTools)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

let backendProcess = null;

async function ensureBackendServer() {
  const isRunning = await pingHttp('http://127.0.0.1:5001/api/health');
  if (isRunning) {
    console.log('[Electron] Backend Express server is already running on port 5001.');
    return true;
  }

  console.log('[Electron] Backend server not active. Spawning embedded server process...');
  const serverCandidates = [
    path.join(__dirname, '../server/server.js'),
    path.join(process.resourcesPath || '', 'server/server.js'),
    path.join(app.getAppPath(), 'server/server.js')
  ];

  const serverPath = serverCandidates.find((p) => p && fs.existsSync(p));
  if (!serverPath) {
    console.warn('[Electron] Could not locate server.js at candidates:', serverCandidates);
    return false;
  }

  const { fork } = require('child_process');
  backendProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: '5001', NODE_ENV: 'production' },
    stdio: 'ignore'
  });

  backendProcess.on('error', (err) => {
    console.error('[Electron] Failed to start backend server:', err);
  });

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await pingHttp('http://127.0.0.1:5001/api/health')) {
      console.log('[Electron] Embedded backend server is online and ready.');
      return true;
    }
  }

  return false;
}

app.whenReady().then(async () => {
  await ensureBackendServer();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
    backendProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Safe IPC Print / PDF handlers
ipcMain.handle('print-receipt', async () => {
  if (!mainWindow) return { success: false };
  try {
    mainWindow.webContents.print({ silent: false, printBackground: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Hardware & License Management Handlers
ipcMain.handle('get-device-info', () => {
  return {
    deviceId: getHardwareId(),
    deviceName: os.hostname(),
    platform: process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux'
  };
});

ipcMain.handle('save-license', (event, licenseData) => {
  try {
    const filePath = getLicenseFilePath();
    const dataWithTimestamp = {
      ...licenseData,
      lastRecordedTimestamp: Date.now()
    };
    fs.writeFileSync(filePath, JSON.stringify(dataWithTimestamp, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('[Electron] Failed to save license:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-license', () => {
  try {
    const filePath = getLicenseFilePath();
    if (!fs.existsSync(filePath)) {
      return { success: true, data: null };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { success: true, data: parsed };
  } catch (err) {
    console.error('[Electron] Failed to load license:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-license', () => {
  try {
    const filePath = getLicenseFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('close-app', () => {
  console.log('[Electron] Immediate application closure triggered by license revocation.');
  try {
    const filePath = getLicenseFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {}

  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
    backendProcess = null;
  }

  app.quit();
});


