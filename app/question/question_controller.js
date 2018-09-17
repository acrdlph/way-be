const error_util = require("../utils/error");
const date_util = require("../utils/datetime");
const question_repository = require("./question_repository");
const question_model = require("./question_model");

/**
 * save a question to the database
 * @param {*} req
 * @param {*} res
 */
exports.saveQuestion = function*(req, res) {
  const { asked_by, content } = req.body;
  if (!content) {
    throw error_util.createError(400, "Please provide proper question!");
  }

  const new_question = new question_model({
    asked_by,
    content,
    asked_at: date_util.serverCurrentDate(),
    replies: [],
    upvotes: 0
  });

  yield question_repository.save(new_question);
  const { _id } = new_question;
  const questions = yield question_repository.find({ _id });
  res.json(questions);
};

exports.deleteQuestion = function*(req, res) {
  yield question_repository.deleteQuestion(req.params.id);
  res.json();
};

exports.saveReply = function*(req, res) {
  const q_id = req.params.id;
  const { replied_by, repl_content } = req.body;
  if (!repl_content)
    throw error_util.createError(400, "Please provide proper reply!");

  const question = yield question_repository.getQuestionIfExists(q_id);
  const reply = {
    replied_by,
    repl_content,
    replied_at: date_util.serverCurrentDate(),
    repl_upvotes: 0
  };
  question.replies = question.replies.concat(reply);
  yield question_repository.save(question);
  console.log(q_id, replied_by, "take it");
  const questions = yield question_repository.find({
    _id: q_id
  });
  res.json(questions);
};

exports.deleteReply = function*(req, res) {
  const q_id = req.params.id;
  const repl_id = req.params.r_id;

  const question = yield question_repository.getQuestionIfExists(q_id);
  question.replies = question.replies.filter(
    repl => repl._id.toString() !== repl_id
  );
  console.log(question.replies);

  yield question_repository.save(question);
  res.json({});
};

exports.upvoteQuestion = function*(req, res) {
  const q_id = req.params.id;

  const question = yield question_repository.getQuestionIfExists(q_id);
  question.upvotes++;

  yield question_repository.save(question);
  res.json({});
};

exports.getAllQuestions = function*(req, res) {
  const questions = yield question_repository.find({});
  res.json(questions);
};
