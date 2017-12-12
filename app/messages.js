const co = require('co');
const moment = require('moment');

const user_model = require('./models/user');
const message_model = require('./models/message');
const util = require('./util');
const logger = require('./logger');

const ws_connections = {};

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
 * initialize a web socket connection
 * @param {*} ws 
 * @param {*} req 
 */
exports.initWsConnection = function* (ws, req) {
    logger.info("ws connection initiated by user ", req.user_id);
    ws.user_id = req.user_id;
    ws_connections[req.user_id] = ws;

    ws.on('message', msg => co(function* () {
        msg = JSON.parse(msg);
        //let sender = yield UserModel.findOne({_id: msg.sender_id});
        //let receiver = yield UserModel.findOne({_id: msg.receiver_id});
        msg.created_at = new Date();
        const new_message = new message_model(msg);
        // save to generate db ID
        yield new_message.save();
        logger.info("Message received ", new_message);
        if (new_message.receiver_id in ws_connections) {
            new_message.delivered = true;
            ws_connections[new_message.receiver_id].send(JSON.stringify(mapMessage(new_message)));
        } else {
            new_message.delivered = false;
        }
        if (new_message.sender_id in ws_connections) {
            ws_connections[new_message.sender_id].send(JSON.stringify(mapMessage(new_message)));
        }
        // save to store delivered status
        yield new_message.save();
    }).catch(err => {
        logger.error(err);
    }));

    // connection close - in the case of a cluster we need to have a background job running to 
    // deliver undelivered messages from the database periodically
    ws.on('close', function (connection) {
        // console.log(connection);
        delete ws_connections[connection.user_id];
    });

    setTimeout(() => co(function* () {
        const undelivered_messages = yield message_model.find(
            {
                receiver_id: req.user_id,
                delivered: false
            }
        )
        if (undelivered_messages.length) {
            undelivered_messages.forEach(msg => co(function* () {
                msg.delivered = true;
                ws_connections[req.user_id].send(JSON.stringify(mapMessage(msg)));
                yield msg.save();
            }).catch(err => {
                logger.error(err);
            }));
        }
    }), 30);
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