
# The WaitList API

## Users

### POST /users

Creates a new user.

#### Request

Example:

    curl -X POST 'http://localhost:3001/users' \
    -H 'Content-Type: application/json' \
    -d '{"location": "ChIJGSZubzgtC4gRVlkRZFCCFX8"}'

Request body parameters:

|name|description|optional|default|example|
|---|---|---|---|---|
|location|id of a location|no||ChIJGSZubzgtC4gRVlkRZFCCFX8|
|waiting_time|waiting time|yes|30|30|
|geolocation|coordinates of a location|yes||{"longitude": -89.398, "latitude": 40.633}|

#### Response

Example:

    {
       "id":"5a38185b8ae6480d1c4455be",
       "default_name":"Still Anonymous",
       "waiting_time":30,
       "location":"ChIJGSZubzgtC4gRVlkRZFCCFX8",
       "geolocation":{
          "longitude":-89.39852830000001,
          "latitude":40.6331249
       },
       "created_at":"2017-12-18T19:34:51.079Z"
    }



### GET /users/:id/details

Returns a user by its ID.

#### Request

Example:

    curl 'http://localhost:3001/users/5a38185b8ae6480d1c4455be/details'

#### Response

Example:

    {
       "id":"5a38185b8ae6480d1c4455be",
       "default_name":"Still Anonymous",
       "waiting_time":30,
       "location":"ChIJGSZubzgtC4gRVlkRZFCCFX8",
       "geolocation":{
          "longitude":-89.39852830000001,
          "latitude":40.6331249
       },
       "created_at":"2017-12-18T19:34:51.079Z"
    }



### GET /users/:id

Returns all users which are at the same location as the user with the given ID.

#### Request

Example:

    curl 'http://localhost:3001/users/5a38185b8ae6480d1c4455be'

#### Response

Example:

    [
       {
          "id":"5a381f6d8ae6480d1c4455c0",
          "name":"Alice",
          "default_name":"Still Anonymous",
          "interests":"Traveling",
          "location":"ChIJGSZubzgtC4gRVlkRZFCCFX8",
          "time_left":29,
          "count":0,
          "non_delivered_count":0,
          "last_contact":null
       }
    ]
