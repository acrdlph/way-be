const _ = require("lodash");
const moment = require("moment");
const message_util = require("./message");
const datetime_util = require("./datetime");

const reducer = (a, b) => {
  return a + b.balance;
};

exports.mapUserOutput = function mapUserOutput(user, token) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    default_name: user.default_name,
    interests: user.interests,
    hangoutPlaces: user.hangoutPlaces,
    location: user.location,
    distance: user.distance,
    address: user.address,
    photo: user.photo,
    geolocation: {
      longitude: _.get(user, "geolocation.coordinates.0"),
      latitude: _.get(user, "geolocation.coordinates.1")
    },
    signed_up: user.signed_up,
    interaction_url: user.interaction_url,
    created_at: user.created_at,
    token: token,
    waytcoins: user.waytcoins,
    endorsement: user.transactions.reduce(reducer, 0),
    seenModals: user.seenModals
  };
};

exports.mapMessageOutput = function mapMessageOutput(msg) {
  return {
    id: msg.id,
    local_id: msg.local_id,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    message: msg.message,
    delivered: msg.delivered,
    created_at: msg.created_at
  };
};

/**
 * TODO test this
 * @param {*} user
 * @param {*} buddy
 * @param {*} messages
 */
exports.waitlistBuddy = function waitlistBuddy(user, buddy, messages) {
  const buddy_messages = messages.filter(
    message => message.sender_id == buddy.id || message.receiver_id == buddy.id
  );
  const buddy_sent_messages = buddy_messages.filter(
    message => message.sender_id == buddy.id && message.receiver_id == user.id
  );
  const non_delivered_messages = buddy_sent_messages.filter(
    message => message.delivered === false
  );
  // sort so that we can get the last contact time
  buddy_messages.sort(message_util.messageDateSortComparator);
  return {
    id: buddy.id,
    name: buddy.name,
    username: buddy.username,
    default_name: buddy.default_name,
    interests: buddy.interests,
    address: buddy.address,
    endorsement: buddy.transactions.reduce(reducer, 0),
    location: buddy.location,
    hangoutPlaces: buddy.hangoutPlaces,
    photo: buddy.photo,
    god_user: buddy.god_user,
    count: buddy_sent_messages.length,
    non_delivered_count: non_delivered_messages.length,
    last_contact:
      buddy_messages.length > 0 ? buddy_messages[0].created_at : null
  };
};

exports.getUserLocation = function getUserLocation(current_location, location) {
  console.log(location.geolocation);
};
