const partner_model = require('../models/partner');

exports.find = function* find(query) {
    const result = yield partner_model.find(query);
    return result;
}

exports.save = function* save(partner) {
    const result = yield partner.save();
    return result;
}