const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let partnerSchema = new Schema({
  name: String,
  industry: String,
  location: String,
  geolocation: { type: { type: String }, coordinates: [ ] },
  created_at: Date
});
partnerSchema.index({ geolocation: '2dsphere' });

let Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;