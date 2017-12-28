const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const standardUser = require('./standard_user_model');

const geoUser = {
  ...standardUser,
  geolocation: Schema.Types.Point
};

// this duplicate object just for geo queries had to be created because of a mongoose bug
// that caused it to throw error when geolocation field is null for a user
const geoUserSchema = new Schema(geoUser);
geoUserSchema.index({ geolocation: '2dsphere' });

const GeoUser = mongoose.model('GeoUser', geoUserSchema, 'users');

module.exports = GeoUser;