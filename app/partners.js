const _ = require('lodash');
const partner_model = require('./models/partner');
const util = require('./util');

/**
 * save a new partner
 * @param {*} req 
 * @param {*} res 
 */
exports.savePartner = function* (req, res) {
    let name = req.body.name;
    let unique_key = req.body.unique_key;
    let location = req.body.location;
    let geolocation = req.body.geolocation;
    let industry = req.body.industry;
    if ((!location && !geolocation) || !name || !unique_key) 
        throw new util.createError(400, 'Please provide name, unique_key and one of the fields location or geolocation');
    let longitude = _.get(geolocation, 'longitude');
    let latitude = _.get(geolocation, 'latitude');
    let existing_partner = yield partner_model.find({unique_key: unique_key});
    if (existing_partner.length) 
        throw new util.createError(400, 'Partner with the given unique key already exists'); 
    let new_partner = new partner_model(
        {
            name: name,
            unique_key: unique_key,
            industry: industry,
            location: location,
            geolocation: longitude && latitude ? {
                type: 'Point',
                coordinates: [ parseFloat(longitude), parseFloat(latitude) ]
            } : null,
            created_at: new Date()
        });
    yield new_partner.save();
    res.send(new_partner);
};

exports.savePartnersForGeoQuery = function* (req, res){
    // TODO call http://www.geonames.org/export/ws-overview.html to get this
}

exports.searchPartners = function* (req, res){
    // TODO send the list of partners for the query
}

exports.getAllPartners = function* (req, res) {
    let partners = yield partner_model.find({});
    res.json(partners);
}