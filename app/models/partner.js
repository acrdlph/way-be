const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const partnerSchema = new Schema({
  name: String,
  industry: String,
  location: String,
  unique_key: { type: String, unique: true },
  geolocation: Schema.Types.Point,
  created_at: Date
});
partnerSchema.index({ geolocation: '2dsphere' });

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;