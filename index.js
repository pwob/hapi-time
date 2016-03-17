'use strict';

const Agenda = require('agenda');
const RequireAll = require('require-all');
const _ = require('lodash');
const Joi = require('joi');

const Package = require('./package');

const internals = {
    optionsSchema: Joi.object({
        mongoUri: Joi.string().required(),
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
        .database(options.mongoUri)
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
    let jobs = RequireAll(options.jobs);

    _.forIn(jobs, (value, key) => {
        let name;
        let method;
        let opts = {};

        if (typeof value === 'function') {
            name = key;
            method = value;
        }
        else {
            name = value.name;
            method = value.job;

            opts = Object.assign({}, value);
            delete opts.name;
            delete opts.job;
        }

        agenda.define(name, opts, (job, done) => {
            server.log(['agenda', 'queue'], { jobName: name, job: job.attrs });
            method(server, job, done);
        });
    });

    agenda.on('ready', () => {
        server.log(['agenda', 'ready']);

        agenda.cancel({}, (err, numRemoved) => {
            if (err) {
                throw err;
            }

            if (numRemoved > 0) {
                server.log(['agenda'], numRemoved + ' jobs cancelled.');
            }

            // https://github.com/rschmukler/agenda#everyinterval-name-data-options-cb
            if (options.every) {
                _.forIn(options.every, (opts, jobName) => {
                    var interval = (typeof opts === 'string') ? opts : opts.interval;
                    // var enabled = (opts.enabled !== undefined)? opts.enabled : true;
                    agenda.every(interval, jobName);
                });
            }

            // https://github.com/rschmukler/agenda#schedulewhen-name-data-cb
            if (options.schedule) {
                _.forIn(options.schedule, (opts, when) => {
                    let jobName = (typeof opts === 'string') ? opts : opts.job;
                    // let enabled = (opts.enabled !== undefined) ? opts.enabled : true;

                    if ((typeof jobName === 'string' && opts.job !== '')) {
                        agenda.schedule(when, jobName);
                    }
                });
            }
            agenda.start();
            next();
        });
    });

    // http://hapijs.com/api#server-events
    server.on('start', () => {
        // Server starting...
    });

    // http://hapijs.com/api#serverexposekey-value
    server.expose('agenda', agenda);

    // http://hapijs.com/api#serverbindcontext
    server.bind({ agenda: agenda });
};

exports.register.attributes = {
    name: Package.name,
    version: Package.version
};
