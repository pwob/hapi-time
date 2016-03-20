'use strict';

const Hapi = require('hapi');
const HapiTime = require('../');
const Moment = require('moment-timezone');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const expect = Code.expect;

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;
const afterEach = lab.afterEach;

const MongoUri = 'localhost:27017/schedule_jobs_test';
const JobsDir = __dirname + '/jobs';

let server = null;

function agenda() {
    return server.plugins['hapi-time'].agenda;
}

function getJobIfExists(jobName, cb) {
    agenda().jobs({name: jobName}, (err, jobs) => {
        return cb(err, jobs[0]);
    });
}

function getAllJobs(cb) {
    agenda().jobs({}, (err, jobs) => {
        return cb(err, jobs);
    });
}

function deleteAllRemainingJobs(cb) {
    agenda().cancel({}, (err, numRemoved) => {
        if (!err && numRemoved > 0) {
            cb(err, numRemoved);
        } else {
            cb(err, 0);
        }
    });
}

describe('hapi-time', () => {

    before((done) => {
        done();
    });

    beforeEach((done) => {
        server = new Hapi.Server();
        server.connection();
        done();
    });

    it('should fail if no \'mongoUri\' and \'jobs\' are specified', (done) => {
        server.register({
            register: HapiTime,
            options: {}
        }, (err) => {
            if (err) {
                done();
            }
        });
    });

    it('should run a repeating job', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': 'say-hello'
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');
                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a repeating job with data', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': {
                        'say-hello' : {
                            data: {
                                userId: 1
                            }
                        }
                    }
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');
                        expect(job.attrs.data.userId).to.equal(1);

                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a repeating job with data and options', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': {
                        'i-am-your-father' : {
                            data: {
                                userId: 1
                            },
                            options: {
                                timezone: 'America/New_York'
                            }
                        }
                    }
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('i-am-your-father', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('i-am-your-father');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');
                        expect(job.attrs.data.userId).to.equal(1);

                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple repeating jobs at the same interval', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': [ 'say-hello', 'i-am-your-father' ]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(job.attrs.repeatInterval).to.equal('10 seconds');
                                done();
                            }
                        });
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple repeating jobs at the same interval without data', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': [{
                        'say-hello': {}
                    }, {
                        'i-am-your-father': {}
                    }]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(job.attrs.repeatInterval).to.equal('10 seconds');
                                done();
                            }
                        });
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple repeating jobs at the same interval with data', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': [
                        {
                            'say-hello' : {
                                data: {
                                    userId: 1
                                }
                            }
                        },
                        {
                            'i-am-your-father': {
                                data: {
                                    userId: 2
                                }
                            }
                        }
                    ]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');
                        expect(job.attrs.data.userId).to.equal(1);

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(job.attrs.repeatInterval).to.equal('10 seconds');
                                expect(job.attrs.data.userId).to.equal(2);

                                done();
                            }
                        });
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple repeating jobs at the same interval with data and options', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': [
                        {
                            'say-hello' : {
                                data: {
                                    userId: 1
                                },
                                options: {
                                    timezone: 'America/New_York'
                                }

                            }
                        },
                        {
                            'i-am-your-father': {
                                data: {
                                    userId: 2
                                },
                                options: {
                                    timezone: 'America/Los_Angeles'
                                }
                            }
                        }
                    ]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');
                        expect(job.attrs.repeatInterval).to.equal('10 seconds');
                        expect(job.attrs.data.userId).to.equal(1);

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(job.attrs.repeatInterval).to.equal('10 seconds');
                                expect(job.attrs.data.userId).to.equal(2);

                                done();
                            }
                        });
                    }
                });
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
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');

                        const expectedDate = Moment(new Date()).add(1, 'days').toDate();
                        expectedDate.setHours(3);
                        expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                        expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());

                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a scheduled job with data', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                schedule: {
                    'every day at 3am': {
                        'say-hello' : {
                            data: {
                                userId: 1
                            }
                        }
                    }
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('say-hello');

                        const expectedDate = Moment(new Date()).add(1, 'days').toDate();
                        expectedDate.setHours(3);
                        expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                        expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());
                        expect(job.attrs.data.userId).to.equal(1);
                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple schedule jobs at the same time', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                schedule: {
                    'every day at 3am': [ 'say-hello', 'i-am-your-father' ]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        const expectedDate = Moment(new Date()).add(1, 'days').toDate();
                        expectedDate.setHours(3);

                        expect(job.attrs.name).to.equal('say-hello');
                        expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                        expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                                expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());

                                done();
                            }
                        });
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple schedule jobs at the same time without data', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                schedule: {
                    'every day at 3am': [
                        {
                            'say-hello' : {
                            }
                        },
                        {
                            'i-am-your-father': {
                            }
                        }
                    ]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        const expectedDate = Moment(new Date()).add(1, 'days').toDate();
                        expectedDate.setHours(3);

                        expect(job.attrs.name).to.equal('say-hello');
                        expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                        expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                                expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());

                                done();
                            }
                        });
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run a multiple schedule jobs at the same time with data', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                schedule: {
                    'every day at 3am': [
                        {
                            'say-hello' : {
                                data: {
                                    userId: 1
                                }
                            }
                        },
                        {
                            'i-am-your-father': {
                                data: {
                                    userId: 2
                                }
                            }
                        }
                    ]
                }
            }
        }, (err) => {
            if (!err) {
                getJobIfExists('say-hello', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        const expectedDate = Moment(new Date()).add(1, 'days').toDate();
                        expectedDate.setHours(3);

                        expect(job.attrs.name).to.equal('say-hello');
                        expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                        expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());
                        expect(job.attrs.data.userId).to.equal(1);

                        getJobIfExists('i-am-your-father', (err, job) => {
                            if (err) {
                                done(err);
                            } else {
                                expect(job.attrs.name).to.equal('i-am-your-father');
                                expect(Moment(job.attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                                expect(Moment(job.attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());
                                expect(job.attrs.data.userId).to.equal(2);

                                done();
                            }
                        });
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run scheduled and repeating jobs together', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
                every: {
                    '10 seconds': 'say-hello'
                },
                schedule: {
                    'every day at 3am': 'i-am-your-father'
                }
            }
        }, (err) => {
            if (!err) {
                getAllJobs((err, jobs) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(jobs[0].attrs.name).to.equal('say-hello');
                        expect(jobs[0].attrs.repeatInterval).to.equal('10 seconds');
                        expect(jobs[1].attrs.name).to.equal('i-am-your-father');

                        const expectedDate = Moment(new Date()).add(1, 'days').toDate();
                        expectedDate.setHours(3);
                        expect(Moment(jobs[1].attrs.nextRunAt).toDate().getDate()).to.equal(expectedDate.getDate());
                        expect(Moment(jobs[1].attrs.nextRunAt).toDate().getHours()).to.equal(expectedDate.getHours());

                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    it('should run job defined in a sub-directory', (done) => {
        server.register({
            register: HapiTime,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir
            }
        }, (err) => {
            if (!err) {
                agenda().now('new-user', { userId: 1 });

                getJobIfExists('new-user', (err, job) => {
                    if (err) {
                        done(err);
                    } else {
                        expect(job.attrs.name).to.equal('new-user');
                        expect(job.attrs.data.userId).to.equal(1);
                        done();
                    }
                });
            } else {
                done(err);
            }
        });
    });

    afterEach((done) => {

        setTimeout(function() {
            if (server.plugins['hapi-time'] != undefined) {
                deleteAllRemainingJobs((err) => {
                    if (err) {
                        done(err);
                    } else {
                        server.stop(() => {
                            agenda().stop();
                            // agenda()._mdb.close(done);
                            done();
                        });
                    }
                });
            } else {
                done();
            }
        }, 50);
    });

    after((done) => {
        done();
    });

});
