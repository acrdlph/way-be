
# The WaitList API

## Accounts

### POST /accounts

Creates a new account

#### Request

Example:

    curl -X POST 'http://localhost:3001/accounts' \
    -H 'Content-Type: application/json' \
    -d '{"username": "maxmustermann", "email": "max@mustermann.org", "password": "abc123"}'

Request body parameters:

|name|description|optional|example|
|---|---|---|---|
|username|unique user name|no|maxmustermann|
|email|the email address of the user|no|max@mustermann.org|
|password|a password|no|abc123|

#### Response

Example:

    {
       "id":"5a3824c18ae6480d1c4455c5",
       "username":"maxmustermann",
       "geolocation":{},
       "signed_up":"2017-12-18T20:27:45.122Z",
       "created_at":"2017-12-18T20:27:45.122Z",
       "token":"5a3824c18ae6480d1c4455c5"
    }


## GET /accounts/checkname/:username

Checks if a user name is available

#### Request

Example:

    curl 'http://localhost:3001/accounts/checkname/ulf'

#### Response

Example:

    {
      "exists": true
    }


## POST /accounts/login

Returns an API token for a user

#### Request

Example:

    curl -X POST 'http://localhost:3001/accounts/login' \
    -H 'Content-Type: application/json' \
    -d '{"loginname": "maxmustermann", "password": "abc123"}'

Request body parameters:

|name|description|optional|example|
|---|---|---|---|
|loginname|user name or email|no|maxmustermann|
|password|a password|no|abc123|

#### Response

Example:

    {
      "token":"5a3824c18ae6480d1c4455c5"
    }
