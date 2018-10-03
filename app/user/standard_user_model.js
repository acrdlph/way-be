const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = {
  name: String,
  address: String,
  username: String,
  transactions: [{ id: String, endorsement: Number, balance: Number }],
  password: String,
  email: String,
  default_name: String,
  waiting_time: Number, // minutes
  waiting_started_at: Date,
  interests: String,
  hangoutPlaces: [{ type: String }],
  location: String,
  photo: String,
  points: Number,
  roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
  signed_up: Date,
  created_at: Date
};
