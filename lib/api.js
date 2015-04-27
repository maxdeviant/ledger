'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var sqlite3 = require('sqlite3').verbose();
var multiline = require('multiline');

var configPath = path.join(__dirname, '../.ledger', 'config.json');
var dataPath = path.join(__dirname, '../.ledger', 'ledger.db');

var db = new sqlite3.Database(dataPath);

var api = exports;

api.init = function (callback) {
    mkdirp(dataPath, function (err) {
        if (err) {

        }

        db.run(multiline(function () {/*
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY,
                project TEXT,
                checkout TEXT,
                checkin TEXT,
                hours INTEGER,
                minutes INTEGER,
                seconds INTEGER
            );
        */}), function (err) {
            if (err) {

            }

            callback();
        });
    });
};

api.checkout = function () {
    var config = loadConfig();

    if (config.project === null) {
        console.log('You do not have a current project');

        return;
    }

    var projectName = config.project.name || config.project;

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

api.checkin = function (callback) {
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

    addRecord(record, function () {
        config.project.checkout = null;

        fs.writeFile(configPath, JSON.stringify(config), function (err) {
            if (err) {

            }

            console.log('Checkin ' + config.project.name + '.');

            if (typeof callback === typeof Function) {
                callback();
            }
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

api.changeProject = function (name) {
    var config = loadConfig();

    if (typeof config.projects === 'undefined') {
        console.log('No projects');

        return;
    }

    if (typeof config.projects[name] === 'undefined') {
        console.log('Could not find project: ' + name);

        return;
    }

    if (config.project.checkout !== null) {
        console.log('Checking in current project: ' + config.project.name);

        api.checkin(function () {
            config.project.name = name;

            fs.writeFile(configPath, JSON.stringify(config), function (err) {
                if (err) {
                    throw err;
                }

                console.log('Switched to project: ' + name);
            });
        });
    }

    config.project.name = name;

    fs.writeFile(configPath, JSON.stringify(config), function (err) {
        if (err) {
            throw err;
        }

        console.log('Switched to project: ' + name);
    });
}

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
        });
    } finally {
        return config;
    }
}

function addRecord(record, callback) {
    db.run(multiline(function () {/*
        INSERT INTO records (project, checkout, checkin, hours, minutes, seconds)
        VALUES ($project, $checkout, $checkin, $hours, $minutes, $seconds);
    */}), {
        $project: record.project,
        $checkout: record.checkout,
        $checkin: record.checkin,
        $hours: record.time.hours,
        $minutes: record.time.minutes,
        $seconds: record.time.seconds
    }, function (err) {
        if (err) {
            throw err;
        }

        callback();
    });
}

Date.prototype.getWeek = function () {
    var date = new Date(this.getTime());

    date.setHours(0, 0, 0, 0);

    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

    var weekOne = new Date(date.getFullYear(), 0, 4);

    return 1 + Math.round(((date.getTime() - weekOne.getTime()) / 86400000 - 3 + (weekOne.getDay() + 6) % 7) / 7);
};
