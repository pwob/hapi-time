'use strict';

const Hapi = require('hapi');
const HapiSchedule = require('../')

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const expect = Code.expect;

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;

const MongoUri = 'localhost:27017/scheduled_tasks';
const JobsDir = __dirname + '/jobs';

let server;

describe('hapi-schedule', () => {

    beforeEach((done) => {
        server = new Hapi.Server();
        server.connection();

        done();
    });

    afterEach((done) => {
        // HapiAgenda.agenda.purge();

        done();
    });

    it('should fail if no mongoUri is specified', (done) => {
        server.register({
            register: HapiSchedule,
            options: {}
        }, (err) => {
            if (err) {
                done();
            }
        });
    });

    it('should run every jobs', (done) => {
        server.register({
            register: HapiSchedule,
            options: {
                mongoUri: MongoUri,
                jobs: JobsDir,
            }
        }, (err) => {
            if (!err) {
                done();
            }
        });
    });

    // it('should run scheduled jobs', (done) => {
    //     server.register({
    //         register: HapiSchedule,
    //         options: {
    //             mongoUri: MongoUri,
    //             jobsDir: JobsDir,
    //             schedule: {
    //                 'every day at 3am': 'say-hello'
    //             }
    //         }
    //     }, (err) => {
    //         if (err) {
    //             done(err);
    //         }
    //         done();
    //     });
    // });

});
