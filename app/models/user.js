const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  default_name: String, 
  waiting_time: Number, // minutes
  interests: String,
  location: String,
  created_at: Date
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;