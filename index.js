'use strict';

const Agenda = require('agenda');
const Recursive = require('recursive-readdir');
const Path = require('path');
const _ = require('lodash');
const Joi = require('joi');

const Package = require('./package');

const internals = {
    optionsSchema: Joi.object({
        mongoUri: Joi.string().required(),
        collection: Joi.string(),
        jobs: Joi.string().required(),
        processEvery: Joi.string().default('30 seconds'),
        maxConcurrency: Joi.number().integer().default(20),
        defaultConcurrency: Joi.number().integer().default(5),
        lockLimit: Joi.number().integer().default(0),
        defaultLockLimit: Joi.number().integer().default(0),
        defaultLockLifetime: Joi.number().integer().default(10000),
        every: Joi.object(),
        schedule: Joi.object()
    })
};

exports.register = function (server, options, next) {
    // Validating the options
    const validateOptions = internals.optionsSchema.validate(options);
    if (validateOptions.error) {
        return next(validateOptions.error);
    }
    options = validateOptions.value;

    // Configuring Agenda
    const agenda = new Agenda();
    agenda
        .database(options.mongoUri, options.collection || 'agendaJobs')
        .processEvery(options.processEvery)
        .maxConcurrency(options.maxConcurrency)
        .defaultConcurrency(options.defaultConcurrency)
        .lockLimit(options.lockLimit)
        .defaultLockLimit(options.defaultLockLimit)
        .defaultLockLifetime(options.defaultLockLifetime);

    // Set Job Queue Events
    agenda.on('start', (job) => {
        server.log(['agenda', 'start'], job.attrs);
    });

    agenda.on('complete', (job) => {
        server.log(['agenda', 'complete'], job.attrs);
    });

    agenda.on('success', (job) => {
        server.log(['agenda', 'success'], job.attrs);
    });

    agenda.on('fail', (err, job) => {
        server.log(['agenda', 'error'], { err: err, job: job.attrs });
    });

    // Retrieve all the jobs from the file system and define them in Agenda
    Recursive(options.jobs, function (err, files) {
        _.forIn(files, (jobFile) => {
            let jobName = Path.parse(jobFile).name;
            let jobFunction;
            let jobOpts = {};

            let job = require(jobFile);
            if (typeof job === 'function') {
                jobFunction = job;
            } else {
                jobName = job.name;
                jobFunction = job.job;

                jobOpts = Object.assign({}, job);
                delete jobOpts.name;
                delete jobOpts.job;
            }

            agenda.define(jobName, jobOpts, (agendaJob, done) => {
                server.log(['agenda', 'queue'], { jobName: jobName, job: agendaJob.attrs });
                jobFunction(server, agendaJob, done);
            });
        });

        agenda.on('ready', () => {
            server.log(['agenda', 'ready']);

            agenda.cancel({}, (err, numRemoved) => {
                if (err) {
                    throw err;
                }

                if (numRemoved > 0) {
                    server.log(['agenda', 'delete'], { jobsRemoved: numRemoved });
                }

                // https://github.com/rschmukler/agenda#everyinterval-name-data-options-cb
                if (options.every) {
                    _.forIn(options.every, (jobOpts, jobInterval) => {
                        if (typeof jobOpts === 'string') {
                            agenda.every(jobInterval, jobOpts);
                        } else {
                            _.forIn(jobOpts, (value, key) => {
                                if (typeof value === 'string') {
                                    agenda.every(jobInterval, value);
                                } else {
                                    if (value.data != undefined) {
                                        if (value.options == undefined) {
                                            agenda.every(jobInterval, key, value.data);
                                        } else {
                                            agenda.every(jobInterval, key, value.data, value.options);
                                        }
                                    }
                                    else {
                                        _.forIn(value, (v, k) => {
                                            if (v.data != undefined) {
                                                if (v.options == undefined) {
                                                    agenda.every(jobInterval, k, v.data);
                                                } else {
                                                    agenda.every(jobInterval, k, v.data, v.options);
                                                }
                                            } else {
                                                agenda.every(jobInterval, k);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }

                // https://github.com/rschmukler/agenda#schedulewhen-name-data-cb
                if (options.schedule) {
                    _.forIn(options.schedule, (jobOpts, when) => {
                        if (typeof jobOpts === 'string') {
                            agenda.schedule(when, jobOpts);
                        } else {
                            _.forIn(jobOpts, (value, key) => {
                                if (typeof value === 'string') {
                                    agenda.schedule(when, value);
                                } else {
                                    if (value.data != undefined) {
                                        agenda.schedule(when, key, value.data);
                                    } else {
                                        _.forIn(value, (v, k) => {
                                            if (v.data == undefined) {
                                                agenda.schedule(when, k);
                                            } else {
                                                agenda.schedule(when, k, v.data);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                agenda.start();
                next();
            });
        });
    });

    // http://hapijs.com/api#serverexposekey-value
    server.expose('agenda', agenda);

    // http://hapijs.com/api#serverbindcontext
    server.bind({ agenda: agenda });

    // http://hapijs.com/api#server-events
    server.on('start', () => {
        // Server starting...
    });
};

exports.register.attributes = {
    name: Package.name,
    version: Package.version
};
