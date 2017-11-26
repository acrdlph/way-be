const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const partnerSchema = new Schema({
  name: String,
  industry: String,
  location: String,
  city: String,
  region: String,
  country: String,
  countryCode: String,
  matching_key: String, // for cases where we have to match a group of locations to the same user location eg: Ubahn line
  unique_key: { type: String, unique: true }, // definite unique key
  geolocation: Schema.Types.Point,
  created_at: Date
});
partnerSchema.index({ geolocation: '2dsphere' });

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;