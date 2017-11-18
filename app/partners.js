const _ = require('lodash');
const partner_model = require('./models/partner');

/**
 * save a new partner
 * @param {*} req 
 * @param {*} res 
 */
exports.savePartner = function* (req, res) {
    let name = req.body.name;
    let location = req.body.location;
    let geolocation = req.body.geolocation;
    let industry = req.body.industry;
    if ((!location && !geolocation) || !name) throw new Error("Can not save partner");
    let longtitude = _.get(geolocation, 'longtitude');
    let latitude = _.get(geolocation, 'latitude');
    let new_partner = new partner_model(
        {
            name: name,
            industry: industry,
            location: location,
            geolocation: longtitude && latitude ? {
                type: 'Point',
                coordinates: [ parseFloat(longtitude), parseFloat(latitude) ]
            } : null,
            created_at: new Date()
        });
    yield new_partner.save();
    res.send(new_partner);
};

exports.getAllPartners = function* (req, res) {
    let partners = yield partner_model.find({});
    res.json(partners);
}