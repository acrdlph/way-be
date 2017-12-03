const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  username: String,
  password: String,
  email: String,
  default_name: String, 
  waiting_time: Number, // minutes
  interests: String,
  location: String,
  photo: String,
  points: Number,
  signed_up: Date,
  created_at: Date
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;