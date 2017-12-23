const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const standardUser = require('./standard_user');

// DO NOT use this for queries unless you strictly want to make a query without geolocation
const userSchema = new Schema(standardUser);

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;