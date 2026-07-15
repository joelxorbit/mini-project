const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initSchema();
  }
});

function initSchema() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        fullName TEXT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT,
        phone TEXT,
        storageUsed INTEGER DEFAULT 0,
        storageLimit INTEGER DEFAULT 10485760,
        plan TEXT DEFAULT 'Free',
        isPremium INTEGER DEFAULT 0,
        joinedDate TEXT,
        role TEXT DEFAULT 'user'
      )
    `);

    // Safely add password column if migrating existing table
    db.run("ALTER TABLE users ADD COLUMN password TEXT", (err) => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        owner TEXT,
        fileName TEXT,
        fileType TEXT,
        fileSize INTEGER,
        uploadDate TEXT,
        isPublic INTEGER DEFAULT 0,
        downloadCount INTEGER DEFAULT 0,
        data TEXT,
        FOREIGN KEY (owner) REFERENCES users(uid)
      )
    `);
  });
}

// Promise wrappers for sqlite3
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
};
