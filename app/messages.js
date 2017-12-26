const co = require('co');
const moment = require('moment');

const message_model = require('./models/message');
const message_repository = require('./repository/message');
const user_repository = require('./repository/user');
const error_util = require('./utils/error');
const datetime_util = require('./utils/datetime');
const mapper_util = require('./utils/mapper');
const logger = require('./logger');

const ws_connections = {};

const SOCKET_EVENTS = {
    NEW_MESSAGE: 'NEW_MESSAGE',
    MESSAGE_DELIVERED: 'MESSAGE_DELIVERED'
};

/**
 * Receive messages for logged in user from a given buddy
 * @param {*} req 
 * @param {*} res 
 */
exports.receiveMessagesByBuddyForLoggedInUser = function* (req, res) {
    const buddy = yield user_repository.getUserIfExists(req.query.buddy_id);
    const messages = yield message_repository.findMessagesBetween(req.user.id, buddy.id);
    const delivered_messages = yield messages.map(message => 
        co(exports.mapToDelivered(req.user.id, message))
        .catch(err => {
            throw error_util.createError(500, err);
        })
    );
    res.json(delivered_messages);
}

/**
 * socket.io connection initialization
 * 
 * RANT: How to handle multi server chat
 * There are few problems that needs to resolved if we are to avoid a single point of failure
 * an support stateless, fully redundant clustering and failover. 
 * - Clients need to continously reconnect if there is a failure. (DONE)
 * - Time should be the same wherever the node is hosted. Solution: use UTC(IN PROGRESS)
 * - Delivered status can not be updated immediately. Solution: confirm delivery from a socket.io event triggered by client.
 * - How do we handle communication between two users who are connected to two different servers in the cluster?
 *      Suggested solution: Then the node which receives a message tries to check if the receiving user is connected to it self, if it is it will deliver.
 *                          if not it will just store the message(but resend to sender to confirm). Clients already poll for available messages when they 
 *                          are in waitlist screen so the messages will get delivered when they see the bubble and navigate to chat from the sender. (DONE)
 * - How do we handle users which have multiple devices connected? The above solution should track and send own messages as well.
 * 
 * @param {*} socket 
 */
exports.initSocketConnection = function* (socket) {
    const {user_id} = socket.handshake.query;
    ws_connections[user_id] = socket;
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg) =>  
        co(exports.handleNewMessage(msg))
        .catch(err => logger.error(err))
    );

    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (message_id) =>  
        co(exports.handleMessageDelivered(message_id))
        .catch(err => logger.error(err))
    );

    socket.on('disconnect', function (reason) {
        logger.debug('user ' + user_id + ' disconnected because of ' + reason);
        delete ws_connections[user_id];
    });
}

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

    // send to the destination
    if (new_message.receiver_id in ws_connections) {
        exports.sendMessage(new_message.receiver_id, new_message);
    } else {
        logger.warn('receiver not connected', new_message.receiver_id);
    }

    // sending back to sender to confirm 
    if (new_message.sender_id in ws_connections) {
        exports.sendMessage(new_message.sender_id, new_message);
    } else {
        logger.error('sender went offline ', new_message.sender_id);
    }
    // save to store delivered status
    message_repository.save(new_message);
}

/**
 * exported for testing
 * @param {*} message_id 
 */
exports.handleMessageDelivered = function* handleMessageDelivered(message_id) {
    const message = yield message_repository.findById(message_id);
    yield exports.mapToDelivered(message.receiver_id, message);
} 

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
}

/**
 * exported for testing
 * @param {*} receiver_id 
 * @param {*} message 
 */
exports.sendMessage = function sendMessage(receiver_id, message) {
    ws_connections[receiver_id].emit(
        SOCKET_EVENTS.NEW_MESSAGE, mapper_util.mapMessageOutput(message));
}