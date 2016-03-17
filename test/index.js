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

    it('should run an every job', (done) => {
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
                setTimeout(() => {
                    const agenda = server.plugins['hapi-time'].agenda;
                    agenda.cancel({name: 'say-hello'}, function(err, numRemoved) {
                        if (!err && numRemoved == 1) {
                            done();
                        } else {
                            done(err);
                        }
                    });
                }, 100);
            } else {
                done(err);
            }
        });

    });

    it('should cancel a disabled every job', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    'say-hello': {
                        enabled: false
                    }
                }
            }
        }, (err) => {
            if (!err) {
                setTimeout(() => {
                    const agenda = server.plugins['hapi-time'].agenda;
                    agenda.cancel({name: 'say-hello'}, function(err, numRemoved) {
                        if (!err && numRemoved == 1) {
                            done();
                        } else {
                            done(err);
                        }
                    });
                }, 100);
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
                setTimeout(() => {
                    const agenda = server.plugins['hapi-time'].agenda;
                    agenda.cancel({name: 'say-hello'}, function(err, numRemoved) {
                        if (!err && numRemoved == 1) {
                            done();
                        } else {
                            done(err);
                        }
                    });
                }, 100);
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
                setTimeout(() => {
                    const agenda = server.plugins['hapi-time'].agenda;
                    agenda.cancel({name: 'say-hello'}, function(err, numRemoved) {
                        if (!err && numRemoved == 1) {
                            done();
                        } else {
                            done(err);
                        }
                    });
                }, 100);
            } else {
                done(err);
            }
        });
    });

    it('should cancel a disabled scheduled job', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                schedule: {
                    'every day at 3am': {
                        job: 'say-hello',
                        enabled: false
                    }
                }
            }
        }, (err) => {
            if (!err) {
                setTimeout(() => {
                    const agenda = server.plugins['hapi-time'].agenda;
                    agenda.cancel({name: 'say-hello'}, function(err, numRemoved) {
                        if (!err && numRemoved == 1) {
                            done();
                        } else {
                            done(err);
                        }
                    });
                }, 100);
            } else {
                done(err);
            }
        });
    });

    after((done) => {
        done();
    });
});
