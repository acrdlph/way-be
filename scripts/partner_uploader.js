#!/usr/bin/env node

const fs = require('fs');
const CsvReadableStream = require('csv-reader');
const co = require('co');
const Promise = require('bluebird');
const rp = require('request-promise');
const GeocoderGeonames = require('geocoder-geonames'),
geocoder = new GeocoderGeonames({
  username: 'waitlist',
});
const WAITLIST_PARTNER_API = 'http://localhost:3001/partners';

const argv = require('optimist')
.usage('Read airports csv.\nUsage: $0')
.demand('f')
.alias('f', 'airportcsv')
.describe('f', 'Load airports csv file')
.argv;
 
co(function* () {
    yield readCsv(argv.airportcsv, 'airport');
})
.catch(e => {
    console.log(e);
});


function* readCsv(filename, industry) {
    const inputStream = fs.createReadStream(filename, 'utf8'); 
    inputStream
       .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
       .on('data', (row) => co(function* () {
           yield handleRow(row, industry);
       }).catch(e => {
            console.log(e);
       }))
       .on('end', function* (data) {
           console.log('No more rows!');
       });
}

function* handleRow(row, industry) {
    console.log('A row arrived: ', row);
    const resp = yield geocoder.get('search',{
        q: row[1] + ' ' + row[2]
      })
    console.log(resp);
    if (resp.totalResultsCount == 0 || resp.totalResultsCount > 1) {
        console.log('********************* zero or more than 1 geocode result warning for ' + row[1]);
    } else {
        yield postPartner(row, resp.geonames[0], industry);
    }
}

function* postPartner(row, geocodes, industry) {
    const options = {
        method: 'POST',
        uri: WAITLIST_PARTNER_API,
        body: {
            name: row[1],
            city: row[0],
            region: geocodes.adminName1,
            country: geocodes.countryName,
            country_code: geocodes.countryCode,
            matching_key: row[2],
            unique_key: row[2],
            location: row[2],
            geolocation: {
                longitude: geocodes.lng,
                latitude: geocodes.lat
            },
            industry: industry
        },
        json: true // Automatically stringifies the body to JSON
    };
    const res = yield rp(options);
    console.log(res);
} 
