const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const co = require('co');
const mimetypes = require('mime-types');

const config = require('./config');
const logger = require('./logger');
const util = require('./util');

const s3 = new aws.S3();

exports.user_upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.get('s3.users_bucket.name'),
        acl: config.get('s3.users_bucket.acl'),
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: (req, file, cb) => {
            co(function* () {
                const user = yield util.getUserIfExists(req.params.user_id);
                cb(null, user.id + '/' + 'profile.' + mimetypes.extension(file.mimetype))
            }).catch((e) => {
                logger.error(e);
                cb(e)
            });
        }
    })
});