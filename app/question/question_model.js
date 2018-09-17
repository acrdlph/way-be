const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  asked_at: Date,
  upvotes: Number,
  content: String,
  asked_by: { type: Schema.Types.ObjectId, ref: "User" },
  replies: [
    {
      replied_by: [{ type: Schema.Types.ObjectId, ref: "User" }],
      replied_at: Date,
      repl_upvotes: Number,
      repl_content: String
    }
  ]
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
