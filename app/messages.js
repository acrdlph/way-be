const co = require('co');
const moment = require('moment');

const user_model = require('./models/user');
const message_model = require('./models/message');
const util = require('./util');

let ws_connections = {};

/**
 * Get messages between provided sender and receiver
 * @param {*} req 
 * @param {*} res 
 */
exports.getMessagesBySenderAndReceiver = function* (req, res) {
    //let sender = yield util.getUserIfExists(req.query.sender_id);
    //let receiver = yield util.getUserIfExists(req.query.receiver_id);
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
        return {
            id: message._id,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            message: message.message,
            created_at: message.created_at
        }
    }).catch(err => {
        console.info(err);
    }));
    res.json(messages);
}

/**
 * initialize a web socket connection
 * @param {*} ws 
 * @param {*} req 
 */
exports.initWsConnection = function* (ws, req) {
    console.log("ws connection initiated by user ", req.user_id);
    ws.user_id = req.user_id;
    ws_connections[req.user_id] = ws;
    let undelivered_messages = yield message_model.find(
        {
            receiver_id: req.user_id,
            delivered: false
        }
    )
    if (undelivered_messages.length) {
        undelivered_messages.forEach(msg => co(function* () {
            ws_connections[req.user_id].send(JSON.stringify({
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                message: msg.message,
                created_at: msg.created_at
            }));
            msg.delivered = true;
            yield msg.save();
        }).catch(err => {
            console.info(err);
        }));
    }

    ws.on('message', msg => co(function* () {
        msg = JSON.parse(msg);
        //let sender = yield UserModel.findOne({_id: msg.sender_id});
        //let receiver = yield UserModel.findOne({_id: msg.receiver_id});
        msg.created_at = new Date();
        console.log("Message received ", msg);
        if (msg.receiver_id in ws_connections) {
            ws_connections[msg.receiver_id].send(JSON.stringify({
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                created_at: msg.created_at,
                message: msg.message
            }));
            msg.delivered = true;
        } else {
            msg.delivered = false;
        }
        if (msg.sender_id in ws_connections) {
            ws_connections[msg.sender_id].send(JSON.stringify({
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                created_at: msg.created_at,
                message: msg.message
            }));
        }
        let new_message = new message_model(msg);
        yield new_message.save();
    }).catch(err => {
        console.info(err);
    }));

    // connection close - in the case of a cluster we need to have a background job running to 
    // deliver undelivered messages from the database periodically
    ws.on('close', function (connection) {
        // console.log(connection);
        delete ws_connections[connection.user_id];
    });
}