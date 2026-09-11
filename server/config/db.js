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

// Ensure local mongod is running if port 27017 isn't responding
async function ensureMongoDaemon() {
  const isPortOpen = await checkPort(27017);
  if (isPortOpen) {
    console.log('[DB] MongoDB service already running on port 27017.');
    return;
  }

  console.log('[DB] Port 27017 not open. Attempting to start local mongod process...');
  const defaultPath = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
  const dbDir = path.resolve(__dirname, '../../data/db');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(defaultPath)) {
    const mongodProc = spawn(defaultPath, ['--dbpath', dbDir, '--port', '27017'], {
      detached: true,
      stdio: 'ignore'
    });
    mongodProc.unref();

    // Wait a few seconds for mongod to initialize
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await checkPort(27017)) {
        console.log('[DB] Local mongod daemon started successfully.');
        return;
      }
    }
  } else {
    console.warn('[DB] mongod executable not found at standard path. Please ensure MongoDB service is started.');
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
