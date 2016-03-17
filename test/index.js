'use strict';

const Hapi = require('hapi');
const HapiTime = require('../');

// const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

// const expect = Code.expect;

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
const after = lab.after;

const MongoUri = 'localhost:27017/schedule_jobs_test';
const JobsDir = __dirname + '/jobs';

let server = null;

function deleteAllRemainingJobs(done) {
    const agenda = server.plugins['hapi-time'].agenda;
    agenda.cancel({}, function(err, numRemoved) {
        if (!err && numRemoved == 1) {
            done();
        } else {
            done(err);
        }
    });
}

describe('hapi-time', () => {

    beforeEach((done) => {
        server = new Hapi.Server();
        server.connection();
        done();
    });

    afterEach((done) => {
        done();
    });

    it('should fail if no mongoUri is specified', (done) => {
        server.register({
            register: HapiTime,
            options: {}
        }, (err) => {
            if (err) {
                done();
            }
        });
    });

    it('should run a job every 10', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    'say-hello': '10 seconds'
                }
            }
        }, (err) => {
            if (!err) {
                done();
            } else {
                done(err);
            }
        });

    });

    it('should run a scheduled and a recurrent job', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    'say-hello': '10 seconds'
                },
                schedule: {
                    'every day at 3am': 'i-am-your-father'
                }
            }
        }, (err) => {
            if (!err) {
                done();
            } else {
                done(err);
            }
        });
    });

    it('should run an every job enabled with interval', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    'say-hello': {
                        interval: '10 seconds',
                        enabled: true
                    }
                }
            }
        }, (err) => {
            if (!err) {
                done();
            } else {
                done(err);
            }
        });

    });

    it('should run a scheduled job', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                schedule: {
                    'every day at 3am': 'say-hello'
                }
            }
        }, (err) => {
            if (!err) {
                done();
            } else {
                done(err);
            }
        });
    });

    after((done) => {
        deleteAllRemainingJobs(done);
    });

});
