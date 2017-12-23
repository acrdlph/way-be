const co = require('co');
const moment = require('moment');

const user_model = require('./models/user');
const message_model = require('./models/message');
const util = require('./util');
const logger = require('./logger');

const ws_connections = {};

const SOCKET_EVENTS = {
    NEW_MESSAGE: 'NEW_MESSAGE'
};

/**
 * Get messages between provided sender and receiver
 * @param {*} req 
 * @param {*} res 
 */
exports.getMessagesBySenderAndReceiver = function* (req, res) {
    //const sender = yield util.getUserIfExists(req.query.sender_id);
    //const receiver = yield util.getUserIfExists(req.query.receiver_id);
    let messages = yield message_model.find({
        $or:
            [
                {
                    sender_id: req.query.sender_id,
                    receiver_id: req.query.receiver_id
                },
                {
                    receiver_id: req.query.sender_id,
                    sender_id: req.query.receiver_id
                }
            ]
    }
    );
    messages = yield messages.map(message => co(function* () {
        // this might not be a good solution because the client can ignore messages even though it downloads
        // ideally the ui should make a call when the user actually sees the message to mark it as delivered
        message.delivered = true;
        yield message.save();
        return mapMessage(message);
    }).catch(err => {
        throw new util.createError(500, err.getMessage());
    }));
    res.json(messages);
}

/**
 * socket.io connection initialization
 * @param {*} socket 
 */
exports.initSocketConnection = function* (socket) {
    const {user_id} = socket.handshake.query;
    ws_connections[user_id] = socket;
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg) =>  
        co(handleNewMessage(msg))
        .catch(err => logger.error(err))
    );

    socket.on('disconnect', function (reason) {
        logger.warn('user ' + user_id + ' disconnected because of ' + reason);
        delete ws_connections[user_id];
    });

    // send undelivered messages
    setTimeout(() => co(function* () {
        const undelivered_messages = yield message_model.find(
            {
                receiver_id: user_id,
                delivered: false
            }
        )
        logger.info('undelivered_messages for ' + user_id, undelivered_messages);
        if (undelivered_messages.length) {
            undelivered_messages.forEach(msg => co(function* () {
                logger.info('sending unsent messages');
                msg.delivered = true;
                ws_connections[user_id].emit(SOCKET_EVENTS.NEW_MESSAGE, mapMessage(msg));
                yield msg.save();
            }).catch(err => {
                logger.error(err);
            }));
        }
    }), 30);
}

function* handleNewMessage(msg) {
    msg.created_at = util.serverCurrentDate();
    const new_message = new message_model(msg);
    // save to generate db ID
    yield new_message.save();
    logger.debug("Message received ", new_message);

    // send to the destination
    if (new_message.receiver_id in ws_connections) {
        new_message.delivered = true;
        ws_connections[new_message.receiver_id].emit(SOCKET_EVENTS.NEW_MESSAGE, 
            mapMessage(new_message));
    } else {
        logger.warn('receiver not connected', new_message.receiver_id);
        new_message.delivered = false;
    }

    // sending back to sender to confirm 
    if (new_message.sender_id in ws_connections) {
        ws_connections[new_message.sender_id].emit(SOCKET_EVENTS.NEW_MESSAGE, 
            mapMessage(new_message));
    } else {
        logger.error('sender went offline ', new_message.sender_id);
    }
    // save to store delivered status
    yield new_message.save();
}

function mapMessage(msg) {
    return {
        id: msg.id,
        local_id: msg.local_id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        message: msg.message,
        delivered: msg.delivered,
        created_at: msg.created_at
    }
}