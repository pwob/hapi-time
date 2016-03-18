# Hapi-Time
Hapi plugin that allows you to run schedule and recurrent jobs using [Agenda](https://github.com/rschmukler/agenda).

[![npm version](https://badge.fury.io/js/hapi-time.svg)](http://badge.fury.io/js/hapi-time)
[![Build Status](https://secure.travis-ci.org/angelstoone/hapi-time.svg)](http://travis-ci.org/angelstoone/hapi-time)
[![Dependencies Status](https://david-dm.org/angelstoone/hapi-time.svg)](https://david-dm.org/angelstoone/hapi-time)
[![DevDependencies Status](https://david-dm.org/angelstoone/hapi-time/dev-status.svg)](https://david-dm.org/angelstoone/hapi-time#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/npm/hapi-time/badge.svg)](https://snyk.io/test/npm/hapi-time)
[![Coverage Status](https://coveralls.io/repos/github/angelstoone/hapi-time/badge.svg)](https://coveralls.io/github/angelstoone/hapi-time?branch=master)

## Installation
```
npm install --save hapi-time
```

## Examples
```javascript
server.register({
    register: HapiTime,
    options: {
        mongoUri: 'localhost:27017/schedule_jobs_test',
        jobs: __dirname + '/jobs',
        every: {
            'say-hello': '10 seconds'
        },
        schedule: {
            'every day at 3am': 'i-am-your-father'
        }
    }
}, (err) => {
    if (!err) {
        // do something!
    }
});
```

The following are all the options of the plugin:
* `mongoUri`
    * a required string
    * must contain only alphanumeric characters
    * at least 3 characters long but no more than 30
    * must be accompanied by `birthyear`
* `jobs`
    * a required string
    * must satisfy the custom regex
    * cannot appear together with `access_token`
* `processEvery`
    * an optional `string interval` which can be a string such as `3 minutes`.
    * By default it is `30 seconds`
* `maxConcurrency`
    * an optional `number` which specifies the max number of jobs that can be running at any given moment.
    * By default it is `20`.
* `defaultConcurrency`
    * an optional `number` which specifies the default number of a specific job that can be running at any given moment.
    * By default it is `5`.
* `lockLimit`
    * an optional `number` which specifies the max number jobs that can be locked at any given moment.
    * By default it is `0` for no max.
* `defaultLockLimit`
    * an optional `number` which specifies the default number of a specific job that can be locked at any given moment.
    * By default it is `0` for no max.
* `defaultLockLifetime`
    * an optional `number` which specifies the default lock lifetime in milliseconds.
    * By default it is 10 minutes. This can be overridden by specifying the `lockLifetime` option to a defined job.
* `every`
    * Runs job `name` at the given `interval`. Optionally, data and options can be passed in.
    * Every creates a job of type `single`, which means that it will only create one job in the database, even if that line is run multiple times. This lets you put it in a file that may get run multiple times, such as `webserver.js` which may reboot from time to time.
    * `interval` can be a human-readable format `String`, a cron format `String`, or a `Number`.
    * `data` is an optional argument that will be passed to the processing function under `job.attrs.data`.
    * `options` is an optional argument that will be passed to `job.repeatEvery`. In order to use this argument, `data` must also be specified.
    * `cb` is an optional callback function which will be called when the job has been persisted in the database.
* `schedule`
    * Schedules a job to run `name` once at a given time.
        * `when` can be a `Date` or a `String` such as `tomorrow at 5pm`.
        * `data` is an optional argument that will be passed to the processing function under `job.attrs.data`.
        * `cb` is an optional callback function which will be called when the job has been persisted in the database.
