const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/tumzytech',
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 1 day
  autoRemove: 'native'
});

module.exports = sessionStore;
