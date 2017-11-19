const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
let userSchema = new Schema({
  name: String,
  default_name: String, 
  waiting_time: Number, // minutes
  interests: String,
  location: String,
  geolocation: { type: { type: String }, coordinates: [ ] },
  created_at: Date
});

userSchema.index({ geolocation: '2dsphere' });

let User = mongoose.model('User', userSchema);

module.exports = User;