'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var configPath = path.join(__dirname, 'config.json');
var dataPath = path.join(__dirname, '../data');

var api = exports;

init();

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

    if (config.project === null) {
        console.log('You do not have a current project');

        return;
    }

    if (config.project.checkout === null) {
        console.log('You do not have a project checked out.');

        return;
    }

    var then = new Date(config.project.checkout);
    var now = new Date();

    var delta = now - then;

    var seconds = Math.floor(delta / 1000);

    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    var hours = Math.floor(minutes / 60);
    minutes -= hours * 60;

    var currentYear = now.getFullYear();
    var currentWeek = now.getWeek();

    var record = {
        'checkout': then.toISOString(),
        'checkin': now.toISOString(),
        'project': config.project.name,
        'time': {
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        }
    };

    var records = loadRecords(currentYear, currentWeek);

    records.push(record);

    mkdirp(path.join(dataPath, currentYear.toString()), function (err) {
        if (err) {

        }

        fs.writeFile(path.join(dataPath, currentYear.toString(), currentWeek.toString() + '.json'), JSON.stringify(records), function (err) {
            if (err) {

            }

            config.project.checkout = null;

            fs.writeFile(configPath, JSON.stringify(config), function (err) {
                if (err) {

                }

                console.log('Checkin ' + config.project.name + '.');
            });
        });
    });
};

api.createProject = function (name) {
    var config = loadConfig();

    if (typeof config.projects === 'undefined') {
        config.projects = {};
    }

    if (typeof config.projects[name] !== 'undefined') {
        console.log('A project named "' + name + '" already exists');

        return;
    }

    config.projects[name] = {
        'hours': 0
    };

    if (config.project === null) {
        config.project = {
            'name': name,
            'checkout': null
        };
    }

    fs.writeFile(configPath, JSON.stringify(config), function (err) {
        if (err) {

        }

        console.log('Created project: ' + name);
    });
};

api.deleteProject = function (name) {
    var config = loadConfig();

    if (typeof config.projects === 'undefined') {
        console.log('No projects');

        return;
    }

    if (typeof config.projects[name] === 'undefined') {
        console.log('Could not find project: ' + name);

        return;
    }

    delete config.projects[name];

    fs.writeFile(configPath, JSON.stringify(config), function (err) {
        if (err) {

        }

        console.log('Deleted project: ' + name);
    });
};

function init() {
    Date.prototype.getWeek = function () {
        var date = new Date(this.getTime());

        date.setHours(0, 0, 0, 0);

        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

        var weekOne = new Date(date.getFullYear(), 0, 4);

        return 1 + Math.round(((date.getTime() - weekOne.getTime()) / 86400000 - 3 + (weekOne.getDay() + 6) % 7) / 7);
    };
}

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

function loadRecords(year, week) {
    var records;

    try {
        records = require(path.join(dataPath, year.toString(), week.toString() + '.json'));
    } catch (e) {
        records = [];
    } finally {
        return records;
    }
}
