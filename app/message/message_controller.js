const co = require("co");
const moment = require("moment");

const message_model = require("./message_model");
const message_repository = require("./message_repository");
const user_repository = require("../user/user_repository");
const error_util = require("../utils/error");
const datetime_util = require("../utils/datetime");
const mapper_util = require("../utils/mapper");
const logger = require("../logger");
const sendEmail = require("../utils/sendEmail");

/**
 * This is an index for all sockets currently handled by the server
 * indexed by user_id, socket_id combination
 */
const ws_connections = {};
var sentFlag = false;
const sentTo = [];
const sentFrom = [];

const SOCKET_EVENTS = {
  NEW_MESSAGE: "NEW_MESSAGE",
  MESSAGE_DELIVERED: "MESSAGE_DELIVERED"
};

/**
 * Receive messages for logged in user from a given buddy
 * @param {*} req
 * @param {*} res
 */
exports.receiveMessagesByBuddyForLoggedInUser = function*(req, res) {
  const buddy = yield user_repository.getUserIfExists(req.query.buddy_id);
  const messages = yield message_repository.findMessagesBetween(
    req.user.id,
    buddy.id
  );
  const delivered_messages = yield messages.map(message =>
    co(exports.mapToDelivered(req.user.id, message)).catch(err => {
      throw error_util.createError(500, err);
    })
  );
  res.json(delivered_messages);
};

exports.getAllLastMessages = function*(req, res) {
  const given_user = yield user_repository.getUserIfExists(req.user.id);
  message_repository.findByReceiverOrSender(given_user.id);
  const messages = yield message_repository.findByReceiverOrSender(
    given_user.id
  );
  var contactedUsers = [];
  var lastMessage = [];
  for (let i = messages.length - 1; i >= 0; --i) {
    if (messages[i].sender_id === given_user.id) {
      if (!contactedUsers.includes(messages[i].receiver_id)) {
        contactedUsers.push(messages[i].receiver_id);
        lastMessage.push(messages[i]);
      }
    } else {
      if (!contactedUsers.includes(messages[i].sender_id)) {
        contactedUsers.push(messages[i].sender_id);
        lastMessage.push(messages[i]);
      }
    }
  }
  res.json(lastMessage);
};

/**
 * socket.io connection initialization
 *
 * RANT: How to handle multi server chat
 * There are few problems that needs to resolved if we are to avoid a single point of failure
 * an support stateless, fully redundant clustering and failover.
 * - Clients need to continously reconnect if there is a failure. (DONE)
 * - Time should be the same wherever the node is hosted. Solution: use UTC(IN PROGRESS)
 * - Delivered status can not be updated immediately. Solution: confirm delivery from a socket.io event triggered by client.(DONE)
 * - How do we handle communication between two users who are connected to two different servers in the cluster?
 *      Suggested solution: Then the node which receives a message tries to check if the receiving user is connected to it self, if it is it will deliver.
 *                          if not it will just store the message(but resend to sender to confirm). Clients already poll for available messages when they
 *                          are in waitlist screen so the messages will get delivered when they see the bubble and navigate to chat from the sender. (DONE)
 * - How do we handle users which have multiple devices connected? The above solution should track and send own messages as well.(DONE)
 *
 * @param {*} socket
 */
exports.initSocketConnection = function*(socket) {
  const { user_id } = socket.handshake.query;
  ws_connections[user_id] = ws_connections[user_id] || {};
  ws_connections[user_id][socket.id] = socket;
  socket.on(SOCKET_EVENTS.NEW_MESSAGE, msg =>
    co(exports.handleNewMessage(msg)).catch(err => logger.error(err))
  );

  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, message_id =>
    co(exports.handleMessageDelivered(message_id)).catch(err =>
      logger.error(err)
    )
  );

  socket.on("disconnect", function(reason) {
    logger.debug("user " + user_id + " disconnected because of " + reason);
    delete ws_connections[user_id];
  });
};

/**
 * exported for testing
 * @param {*} msg
 */
exports.handleNewMessage = function* handleNewMessage(msg) {
  msg.created_at = datetime_util.serverCurrentDate();
  msg.delivered = false;
  const new_message = new message_model(msg);
  // save to generate db ID
  yield message_repository.save(new_message);
  logger.debug("Message received ", new_message);
  if (!sentTo.includes(new_message.receiver_id)) {
    sentTo.push(new_message.receiver_id);
    sentFlag = false;
  }
  if (!sentFrom.includes(new_message.sender_id)) {
    sentFrom.push(new_message.sender_id);
    sentFlag = false;
  }
  // send to the destination
  if (new_message.receiver_id in ws_connections) {
    exports.sendMessage(new_message.receiver_id, new_message);
    sentFlag = false;
  } else {
    logger.warn("receiver not connected", new_message.receiver_id);
    if (sentFlag === false) {
      const sendTo = yield user_repository.getUserIfExists(
        new_message.receiver_id
      );
      sendEmail(sendTo.email);
    }
    sentFlag = true;
  }

  // sending back to sender to confirm
  if (new_message.sender_id in ws_connections) {
    exports.sendMessage(new_message.sender_id, new_message);
  } else {
    logger.error("sender went offline ", new_message.sender_id);
  }
};

/**
 * exported for testing
 * @param {*} message_id
 */
exports.handleMessageDelivered = function* handleMessageDelivered(message_id) {
  const message = yield message_repository.findById(message_id);
  yield exports.mapToDelivered(message.receiver_id, message);
};

/**
 * exported for testing
 * @param {*} message
 */
exports.mapToDelivered = function* mapToDelivered(receiver_id, message) {
  // if the messages receiver is the given receiver_id mark it as delivered
  if (!message.delivered && message.receiver_id == receiver_id) {
    message.delivered = true;
    yield message_repository.save(message);
  }
  return mapper_util.mapMessageOutput(message);
};

/**
 * exported for testing
 * @param {*} receiver_id
 * @param {*} message
 */
exports.sendMessage = function sendMessage(receiver_id, message) {
  // send to all sockets attributed to the given receiver_id
  // i.e all sessions/browsers/devices of the user with the given receiver_id
  Object.keys(ws_connections[receiver_id]).forEach(socket_id => {
    ws_connections[receiver_id][socket_id].emit(
      SOCKET_EVENTS.NEW_MESSAGE,
      mapper_util.mapMessageOutput(message)
    );
  });
};
