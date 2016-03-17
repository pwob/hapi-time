'use strict';

module.exports = (server, data, done) => {
    server.log(['agenda', 'job'], 'Hello world');
    done();
};
