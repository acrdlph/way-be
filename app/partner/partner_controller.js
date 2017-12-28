const _ = require('lodash');

const partner_model = require('./partner_model');
const partner_repository = require('./partner_repository');
const error_util = require('../utils/error');
const datetime_util = require('../utils/datetime');
const db_util = require('../utils/db');

/**
 * save a new partner
 * @param {*} req 
 * @param {*} res 
 */
exports.savePartner = function* (req, res) {
    const name = req.body.name;
    const city = req.body.city;
    const region = req.body.region;
    const country = req.body.country;
    const countryCode = req.body.country_code;
    const matching_key = req.body.matching_key;
    const unique_key = req.body.unique_key;
    const location = req.body.location;
    const geolocation = req.body.geolocation;
    const industry = req.body.industry;
    if ((!location && !geolocation) || !name || !unique_key) 
        throw error_util.createError(400, 'Please provide name, unique_key and one of the fields location or geolocation');
    const longitude = _.get(geolocation, 'longitude');
    const latitude = _.get(geolocation, 'latitude');
    const existing_partner = yield partner_repository.find({unique_key: unique_key});
    if (existing_partner.length) 
        throw error_util.createError(400, 'Partner with the given unique key already exists'); 
    const new_partner = new partner_model(
        {
            name: name,
            city: req.body.city,
            region: req.body.region,
            country: req.body.country,
            countryCode: req.body.country_code,
            matching_key: req.body.matching_key,
            unique_key: unique_key,
            industry: industry,
            location: location,
            geolocation: longitude && latitude ? 
                db_util.constructPoint(parseFloat(longitude), parseFloat(latitude)) : null,
            created_at: datetime_util.serverCurrentDate()
        });
    yield partner_repository.save(new_partner);
    res.json(new_partner);
};

exports.savePartnersForGeoQuery = function* (req, res){
    // TODO call http://www.geonames.org/export/ws-overview.html to get this
}

exports.searchPartners = function* (req, res){
    // TODO send the list of partners for the query
}

exports.getAllPartners = function* (req, res) {
    const partners = yield partner_repository.find({});
    res.json(partners);
}