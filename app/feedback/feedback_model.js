const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  email: String,
  feedback: String,
  created_at: Date
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
