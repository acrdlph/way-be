const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this duplicate object just for geo queries had to be created because of a mongoose bug
// that caused it to throw error when geolocation field is null for a user
const geoUserSchema = new Schema({
  name: String,
  username: String,
  password: String,
  email: String,
  default_name: String, 
  waiting_time: Number, // minutes
  interests: String,
  location: String,
  photo: String,
  geolocation: Schema.Types.Point,
  signed_up: Date,
  created_at: Date
});
geoUserSchema.index({ geolocation: '2dsphere' });

const GeoUser = mongoose.model('GeoUser', geoUserSchema, 'users');

module.exports = GeoUser;