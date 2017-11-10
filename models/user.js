const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
let userSchema = new Schema({
  name: String,
  waiting_time: Number, // minutes
  interests: String,
  location: String,
  created_at: Date
});

let User = mongoose.model('User', userSchema);

module.exports = User;