'use strict';

module.exports = (server, job, done) => {
    server.log(['agenda', 'job'], 'Welcome user ' + job.attrs.data.userId);
    done();
};
