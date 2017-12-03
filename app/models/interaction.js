const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const interactionSchema = new Schema({
  initiator: String, // username
  initiator_id: String, 
  receiver: String, // username
  receiver_id: String,
  confirmation_code: String, // timestamp
  confirmed_on: Date, 
  expired_on: Date,
  geolocation: Schema.Types.Point,
  created_at: Date
});
interactionSchema.index({ geolocation: '2dsphere' });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;