'use strict';

const Agenda = require('agenda');
const RequireAll = require('require-all');
const fs = require('fs');
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
        defaultLockLifetime: Joi.number().integer().default(10000)
    })
};

exports.register = function (server, options, next) {
    const validateOptions = internals.optionsSchema.validate(options);
    if (validateOptions.error) {
        return next(validateOptions.error);
    }
    options = validateOptions.value;

    let agenda = new Agenda();
    agenda
        .database(options.mongoUri)
        .processEvery(options.processEvery)
        .maxConcurrency(options.maxConcurrency)
        .defaultConcurrency(options.defaultConcurrency)
        .lockLimit(options.lockLimit)
        .defaultLockLimit(options.defaultLockLimit)
        .defaultLockLifetime(options.defaultLockLifetime);

    // Set Job Queue Events
    agenda.on('start', function(job) {
        server.log(['agenda', 'start'], job.attrs);
    });

    agenda.on('complete', function(job) {
        server.log(['agenda', 'complete'], job.attrs);
    });

    agenda.on('success', function(job) {
        server.log(['agenda', 'success'], job.attrs);
    });

    agenda.on('fail', function(err, job) {
        server.log(['agenda', 'error'], { err: err, job: job.attrs });
    });

    let jobs = {};
    if (options.jobs && fs.existsSync(options.jobs)) {
        jobs = RequireAll(options.jobs);
    }

    _.forIn(jobs, function(value, key) {
        let opts = {};
        let name, method;

        if (typeof value === 'function') {
            name = key;
            method = value;
        } else {
            name = value.name;
            method = value.job;

            delete value.name;
            delete value.job;

            opts = value;
        }

        agenda.define(key, opts, function(job, done) {
          plugin.log(['agenda', 'queue'], { jobName: name, job: job.attrs });
          method.call(server, job, done);
        });
    });

    // https://github.com/rschmukler/agenda#everyinterval-name-data-options-cb
    if (options.every) {
        _.forIn(options.every, function(opts, jobName) {
            var interval = (typeof opts === 'string') ? opts : opts.interval;
            var enabled = (opts.enabled !== undefined)? opts.enabled : true;

            if (enabled === false) {
                return agenda.cancel({name: jobName}, function(err, numRemoved) {
                    if(err) {
                      throw err;
                    }
                });
            }

            agenda.every(interval, jobName);
        });
    }

    // https://github.com/rschmukler/agenda#schedulewhen-name-data-cb
    if (options.schedule) {
        _.forIn(options.schedule, function(opts, when) {
            let task = (typeof opts === 'string') ? opts : opts.task;
            let enabled = (opts.enabled !== undefined) ? opts.enabled : true;

            if ((typeof task === 'string' && opts.task !== '')) {
                if (enabled === true) {
                  agenda.schedule(when, task);
                }
                else {
                    return agenda.cancel({ name: task }, function(err, numRemoved) {
                        if (err) {
                            throw err;
                        }
                    });
                }
            }
        });
    }

    // http://hapijs.com/api#serverexposekey-value
    server.expose('agenda', agenda);

    // http://hapijs.com/api#serverbindcontext
    server.bind({ agenda: agenda });

    // http://hapijs.com/api#server-events
    server.on('start', function() {
        agenda.start();
    });

    next();
};

exports.register.attributes = {
    name: Package.name,
    version: Package.version
};
