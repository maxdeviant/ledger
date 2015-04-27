'use strict';

var cli = require('commander');

cli
    .version('0.0.1')
    .command('checkout', 'checkout a project')
    .command('checkin', 'checkin a project')
    .parse(process.argv);
