const partner_model = require('../models/partner');
const constants = require('../utils/constants');

exports.find = function* find(query) {
    const result = yield partner_model.find(query);
    return result;
}

exports.save = function* save(partner) {
    const result = yield partner.save();
    return result;
}

exports.nearBy = function* nearBy(geolocation) {
    const partners_nearby = yield partner_model.find({
        geolocation: {
            $nearSphere: {
                $geometry: geolocation,
                $maxDistance: constants.PARTNER_NEAR_BY_DISTANCE
            }
        }
    });
    return partners_nearby;
}