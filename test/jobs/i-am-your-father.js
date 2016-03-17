'use strict';

module.exports = {
    name: 'i-am-your-father',

    job: (server, data, done) => {
        server.log(['agenda', 'job'], 'I am your father!');
        done();
    }
};
