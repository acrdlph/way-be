const expect = require('chai').expect;

exports.delay = function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

exports.tryWithSuccess = function* (promise) {
    try {
        const res = yield promise;
        return res;
    } catch (err) {
        expect(true).to.equal(false); // make the test fail
    }
}

exports.tryWithFailure = function* (promise, exception_name) {
    try {
        yield promise;
        expect(true).to.equal(false); // make the test fail
    } catch (err) {
        expect(err.name).to.equal(exception_name);
    }
}

exports.fail = function fail() {
    expect(true).to.equal(false); 
}