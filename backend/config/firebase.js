const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { getDatabase } = require('firebase-admin/database');

const serviceAccount = require('./service.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://mini-project-41764-default-rtdb.firebaseio.com'
});

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

module.exports = { db, auth, storage, rtdb };
