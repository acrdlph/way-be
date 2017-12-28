const message_model = require('./message_model');

exports.find = function* find(query) {
    const result = yield message_model.find(query);
    return result;
}

exports.findById = function* find(message_id) {
    const result = yield message_model.findById(message_id);
    return result;
}

exports.save = function* save(message) {
    const result = yield message.save();
    return result;
}

exports.findNonDeliveredMessagesByReceiver = function* findNonDeliveredMessagesByReceiver(receiver_id) {
    const result = yield message_model.find(
        {
            receiver_id: receiver_id,
            delivered: false
        }
    );
    return result;
}

exports.findMessagesBetween = function* findMessagesBetween(sender_id, receiver_id) {
    const messages = yield message_model.find(
        {
            $or:
            [
                {
                    sender_id: sender_id,
                    receiver_id: receiver_id
                },
                {
                    receiver_id: sender_id,
                    sender_id: receiver_id
                }
            ]
        }
    );
    return messages;
}

exports.findByReceiver = function* (user_id) {
    const messages = yield message_model.find({ receiver_id: user_id });
    return messages;
}