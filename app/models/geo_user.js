const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const geoUserSchema = new Schema({
  name: String,
  default_name: String, 
  waiting_time: Number, // minutes
  interests: String,
  location: String,
  geolocation: Schema.Types.Point,
  created_at: Date
});
geoUserSchema.index({ geolocation: '2dsphere' });

const GeoUser = mongoose.model('GeoUser', geoUserSchema, 'users');

module.exports = GeoUser;