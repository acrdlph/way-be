const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
let messageSchema = new Schema({
  sender_id: String,
  receiver_id: String,
  message: String,
  created_at: Date,
  delivered: Boolean
});

let Message = mongoose.model('Message', messageSchema);

module.exports = Message;