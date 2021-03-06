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
  interests: String,
  hangoutPlaces: [{ place: String, id: String }],
  location: String,
  distance: Number,
  photo: String,
  points: Number,
  roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
  signed_up: Date,
  created_at: Date,
  seenModals: {
    seenListModal: Boolean,
    seenLocModal: Boolean,
    seenProfModal: Boolean
  }
};
