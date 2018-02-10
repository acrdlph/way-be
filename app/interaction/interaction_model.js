const geojson = require('mongoose-geojson-schema');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const interactionSchema = new Schema({
  confirmation_code: String,
  initiator_id: String,
  confirmor_id: String,
  confirmed_on: Date,
  expired_on: Date,
  created_at: Date
});

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
