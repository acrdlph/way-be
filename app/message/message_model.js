const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
const messageSchema = new Schema({
  local_id: String,
  sender_id: String,
  receiver_id: String,
  message: String,
  created_at: Date,
  delivered: Boolean
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;