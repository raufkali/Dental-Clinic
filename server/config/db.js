const mongoose = require('mongoose');
const net = require('net');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if port is open
function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Locate mongod executable from embedded electron package or system installation
function findMongodExecutable() {
  const candidates = [
    // 1. Packaged electron resources path (production installer / portable exe)
    process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'mongod.exe') : null,
    process.resourcesPath ? path.join(process.resourcesPath, 'electron', 'bin', 'mongod.exe') : null,
    // 2. Bundled inside project electron/bin directory
    path.resolve(__dirname, '../../electron/bin/mongod.exe'),
    path.resolve(__dirname, '../bin/mongod.exe'),
    path.resolve(process.cwd(), 'electron/bin/mongod.exe'),
    // 3. Standard system installation fallbacks
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

// Get safe, writable database storage directory
function getDbStorageDir() {
  const localDbDir = path.resolve(__dirname, '../../data/db');
  
  // For production or when running as packaged exe, write to AppData to avoid permission errors
  const appDataDir = process.env.APPDATA 
    ? path.join(process.env.APPDATA, 'dental-clinic-system', 'data', 'db')
    : (process.platform === 'darwin'
        ? path.join(process.env.HOME || '', 'Library', 'Application Support', 'dental-clinic-system', 'data', 'db')
        : path.join(process.env.HOME || '', '.dental-clinic-system', 'data', 'db'));

  // If running in production or root data dir is not directly writable
  if (process.env.NODE_ENV === 'production') {
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    return appDataDir;
  }

  // In development, prefer local project data/db if available
  try {
    if (!fs.existsSync(localDbDir)) {
      fs.mkdirSync(localDbDir, { recursive: true });
    }
    return localDbDir;
  } catch (err) {
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    return appDataDir;
  }
}

// Ensure local mongod is running if port 27017 isn't responding
async function ensureMongoDaemon() {
  const isPortOpen = await checkPort(27017);
  if (isPortOpen) {
    console.log('[DB] MongoDB service already running on port 27017.');
    return;
  }

  console.log('[DB] Port 27017 not open. Searching for mongod executable...');
  const mongodPath = findMongodExecutable();
  const dbDir = getDbStorageDir();

  if (mongodPath) {
    console.log(`[DB] Starting embedded MongoDB daemon: ${mongodPath}`);
    console.log(`[DB] Database storage directory: ${dbDir}`);

    const mongodProc = spawn(mongodPath, ['--dbpath', dbDir, '--port', '27017', '--bind_ip', '127.0.0.1'], {
      detached: true,
      stdio: 'ignore'
    });
    mongodProc.unref();

    // Wait a few seconds for mongod to initialize
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await checkPort(27017)) {
        console.log('[DB] Local mongod daemon started successfully.');
        return;
      }
    }
    console.warn('[DB] MongoDB daemon did not respond within 20s.');
  } else {
    console.warn('[DB] mongod executable not found at any bundled or system paths. Please ensure MongoDB is started.');
  }
}

const connectDB = async () => {
  try {
    await ensureMongoDaemon();
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_clinic');
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
