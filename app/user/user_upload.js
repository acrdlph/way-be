const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const co = require('co');
const mimetypes = require('mime-types');

const config = require('../config');
const logger = require('../logger');
const user_repository = require('./user_repository');
const datetime_util = require('../utils/datetime');

const s3 = new aws.S3();

exports.photo = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.get('s3.users_bucket.name'),
        acl: config.get('s3.users_bucket.acl'),
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: (req, file, cb) => {
            co(function* () {
                const user = yield user_repository.getUserIfExists(req.params.user_id);
                file.standard_name = `profile-${datetime_util.serverCurrentDate().getTime()}.` + mimetypes.extension(file.mimetype);
                cb(null, user.id + '/' + file.standard_name);
            }).catch((e) => {
                logger.error(e);
                cb(e);
            });
        }
    })
});
