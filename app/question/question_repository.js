const mongoose = require("mongoose");
const question_model = require("./question_model");
const error_util = require("../utils/error");
const User = require("../user/user_model");

exports.find = function* find(query) {
  const result = yield question_model
    .find(query)
    .populate(
      "asked_by",
      "-_id -email -password -default_name -signed_up -created_at -__v -geolocation -location -interests -roles -transactions"
    )
    .populate(
      "replies.replied_by",
      "-_id -email -password -default_name -signed_up -created_at -__v -geolocation -location -interests -roles -transactions"
    );

  return result;
};

exports.save = function* save(question) {
  const result = yield question.save();
  return result;
};

exports.deleteQuestion = function* deleteQuestion(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw error_util.createError(400, "Invalid Question Id " + id);
  }
  yield question_model.findByIdAndRemove(id);
};

exports.getQuestionIfExists = function* getQuestionIfExists(id) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw error_util.createError(400, "Invalid Question Id " + id);
  const question = yield question_model.findOne({ _id: id });

  if (question === undefined)
    throw error_util.createError(404, "Question not found!");
  return question;
};
