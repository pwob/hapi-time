'use strict';

module.exports = (server, data, done) => {
    server.log(['agenda', 'job'], 'Welcome user!');
    done();
};
