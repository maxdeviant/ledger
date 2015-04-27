'use strict';

var cli = require('commander');

cli
    .version('0.0.1')
    .command('checkout', 'checkout a project')
    .command('checkin', 'checkin a project')
    .command('create', 'create a project')
    .command('list', 'list all projects')
    .command('switch', 'switch to a project')
    .command('delete', 'delete a project')
    .parse(process.argv);
