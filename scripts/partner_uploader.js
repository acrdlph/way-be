#!/usr/bin/env node

const fs = require('fs');
const CsvReadableStream = require('csv-reader');
const co = require('co');
const Promise = require('bluebird');
const rp = require('request-promise');
const NodeGeocoder = require('node-geocoder');
const GeocoderGeonames = require('geocoder-geonames');
const geocoder = new GeocoderGeonames({
  username: 'waitlist',
});
const WAITLIST_PARTNER_API = 'http://localhost:3001/partners';

const nodeGeocoderOptions = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyD9s5tjKB32xG17cw4wCJEIM49uJ-Ook0w', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

const nodeGeocoder = NodeGeocoder(nodeGeocoderOptions);

const argv = require('optimist')
.usage('Read partner csv.\nUsage: $0 -f [file] -t [type]')
.demand(['f','t'])
.alias('f', 'file')
.alias('t', 'fileType')
.describe('f', 'File to load')
.describe('t', 'Type of file')
.argv;
 
co(function* () {
    yield readCsv(argv.fileType, argv.file, 'ubahn');
})
.catch(e => {
    console.log(e);
});

function* readCsv(fileType, filename, industry) {
    const inputStream = fs.createReadStream(filename, 'utf8'); 
    inputStream
       .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
       .on('data', (row) => co(function* () {
           yield handleRow(fileType, row, industry);
       }).catch(e => {
            console.log(e);
       }))
       .on('end', function* (data) {
           console.log('No more rows!');
       });
}

function* handleRow(fileType, row, industry) {
    console.log('A row arrived: ', row);
    let resp = {};
    if (fileType == 'airport') {
        resp = yield geocoder.get('search',{
            q: queryStringMapper[fileType](row)
          });
        if (resp.totalResultsCount == 0 || resp.totalResultsCount > 1) {
            console.log('********************* zero or more than 1 geocode result warning for ' + row[1]);
            return;
        } 
        resp = resp.geonames[0];
    } else {
        resp = yield nodeGeocoder.geocode(queryStringMapper[fileType](row));
        console.log(resp);
        if (resp.length == 0 || resp.length > 1) {
            console.log('********************* zero or more than 1 geocode result warning for ' + row[1]);
            return;
        } 
        resp = resp[0];
    }
    yield postPartner(fileType, row, resp, industry);
}

const queryStringMapper = {
    airport: (row) => {
        return row[1] + ' ' + row[2];
    },
    trainStation: (row) => {
        console.log('berlin ' + row[0] + ' ' + row[1]);
        return 'berlin ubahn ' + row[0] + ' ' + row[1];
    }
};

function* postPartner(fileType, row, geocodes, industry) {
    const options = {
        method: 'POST',
        uri: WAITLIST_PARTNER_API,
        body: bodyMapper[fileType](row, geocodes, industry),
        json: true // Automatically stringifies the body to JSON
    };
    const res = yield rp(options);
    console.log(res);
} 

const bodyMapper = {
    airport: (row, geocodes, industry) => {
        return {
            name: row[1],
            city: row[0],
            region: geocodes.adminName1,
            country: geocodes.countryName,
            country_code: geocodes.countryCode,
            matching_key: row[2],
            unique_key: row[2].replace(" ","_"),
            location: row[2],
            geolocation: {
                longitude: geocodes.lng,
                latitude: geocodes.lat
            },
            industry: industry
        };
    },
    trainStation: (row, geocodes, industry) => {
        return {
            name: row[0] + ' ' + row[1],
            city: geocodes.city,
            region: geocodes.administrativeLevels.level1short,
            country: geocodes.country,
            country_code: geocodes.countryCode,
            matching_key: row[3],
            unique_key: (row[0] + '_' + row[1]).replace(" ","_"),
            location: row[3],
            geolocation: {
                longitude: geocodes.longitude,
                latitude: geocodes.latitude
            },
            industry: industry
        };
    }
};
