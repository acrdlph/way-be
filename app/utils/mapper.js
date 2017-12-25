const _ = require('lodash');

exports.mapUserOutput = function mapUserOutput(user, token) {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        default_name: user.default_name,
        interests: user.interests,
        waiting_time: user.waiting_time,
        waiting_started_at: user.waiting_started_at,
        location: user.location,
        photo: user.photo,
        geolocation: {
            longitude: _.get(user, 'geolocation.coordinates.0'),
            latitude: _.get(user, 'geolocation.coordinates.1')
        },
        signed_up: user.signed_up,
        interaction_url: user.interaction_url,
        created_at: user.created_at,
        token: token
    }
}

exports.mapMessageOutput = function mapMessageOutput(msg) {
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