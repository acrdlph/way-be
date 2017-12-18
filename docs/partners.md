
# The WaitList API

## Partners

### GET /partners

Returns all partner locations

#### Request

Example:

    curl 'http://localhost:3001/partners'

#### Response

Example:

    [
       {
          "_id":"5a118ecba197588ebfafb8bd",
          "name":"Munich Airport",
          "unique_key":"MUC",
          "industry":"airport",
          "location":"MUC",
          "created_at":"2017-11-19T14:01:47.441Z",
          "geolocation":{
             "coordinates":[
                11.7750279,
                48.3536621
             ],
             "type":"Point"
          },
          "__v":0
       },
       {
          "_id":"5a118f87a197588ebfafb8be",
          "name":"Amsterdam Airport Schiphol",
          "unique_key":"AMS",
          "industry":"airport",
          "location":"AMS",
          "created_at":"2017-11-19T14:04:55.242Z",
          "geolocation":{
             "coordinates":[
                4.7682744,
                52.3105386
             ],
             "type":"Point"
          },
          "__v":0
       },
       {
          "_id":"5a1aec3f249a1f63e031aceb",
          "name":"John C. Munro Hamilton International Airport",
          "city":"Hamilton",
          "region":"Ontario",
          "country":"Canada",
          "countryCode":"CA",
          "matching_key":"YHM",
          "unique_key":"YHM",
          "industry":"airport",
          "location":"YHM",
          "geolocation":{
             "type":"Point",
             "coordinates":[
                -79.92914,
                43.17094
             ]
          },
          "created_at":"2017-11-26T16:30:55.333Z",
          "__v":0
       }
    ]
