'use strict';

var fs = require('fs');
var path = require('path');

var configPath = path.join(__dirname, 'config.json');

var api = exports;

api.checkout = function () {
    var config = loadConfig();

    var projectName = config.project.name || config.project;

    if (config.project === null) {
        console.log('You do not have a current project');

        return;
    }

    if (config.project.checkout !== null) {
        console.log('You already have ' + projectName + ' checked out.');

        return;
    }

    config.project = {
        'name': projectName,
        'checkout': Date.now()
    };

    fs.writeFile(configPath, JSON.stringify(config), function (err) {
        if (err) {

        }

        console.log('Checkout ' + config.project.name + '.');
    });
};

api.checkin = function () {
    var config = loadConfig();

    var then = new Date(config.project.checkout);
    var now = Date.now();

    var delta = now - then;

    var seconds = Math.floor(delta / 1000);

    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    var hours = Math.floor(minutes / 60);
    minutes -= hours * 60;

    console.log(hours + ':' + minutes + ':' + seconds);
};

function loadConfig() {
    var config;

    try {
        config = require(configPath);
    } catch (e) {
        config = {
            'project': null
        };

        fs.writeFile(configPath, JSON.stringify(config), function (err) {
            if (err) {

            }

            console.log('Wrote to config');
        });
    } finally {
        return config;
    }
}
