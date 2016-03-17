'use strict';

module.exports = {
    name: 'I am your father!',
    job: (server, data, done) => {
        server.log(['agenda', 'job'], 'I am your father!');
        done();
    }
};
