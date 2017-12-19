
# The WaitList API

## Messages

### GET /messages

Returns all messages between two users

#### Request

Example:

    curl 'http://localhost:3001/messages?sender_id=5a381f6d8ae6480d1c4455c0&receiver_id=5a381f798ae6480d1c4455c1'

Query parameters:

|name|description|optional|example|
|---|---|---|---|
|sender_id|user id of sender|no|5a381f6d8ae6480d1c4455c0|
|receiver_id|user id of receiver|no|5a381f798ae6480d1c4455c1|

Note: sender_id and receiver_id can be swapped. It still represents a chat between the same users.


#### Response

Example:

    [
       {
          "id":"5a3821c58ae6480d1c4455c2",
          "local_id":"a928647d-11fc-48b2-91d7-9050935629ad",
          "sender_id":"5a381f798ae6480d1c4455c1",
          "receiver_id":"5a381f6d8ae6480d1c4455c0",
          "message":"hi",
          "delivered":true,
          "created_at":"2017-12-18T20:15:01.072Z"
       },
       {
          "id":"5a3821cd8ae6480d1c4455c3",
          "local_id":"5c83376d-6009-46c3-81da-a0754d5e562e",
          "sender_id":"5a381f6d8ae6480d1c4455c0",
          "receiver_id":"5a381f798ae6480d1c4455c1",
          "message":"Hola!",
          "delivered":true,
          "created_at":"2017-12-18T20:15:09.094Z"
       },
       {
          "id":"5a3821d78ae6480d1c4455c4",
          "local_id":"a4de0b14-c350-4a58-9bbf-005b7c3cf961",
          "sender_id":"5a381f798ae6480d1c4455c1",
          "receiver_id":"5a381f6d8ae6480d1c4455c0",
          "message":"How are you?",
          "delivered":true,
          "created_at":"2017-12-18T20:15:19.174Z"
       }
    ]
