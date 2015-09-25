"use strict";

var taskFinder = require('./index.js'),
    express    = require('express');

var app = express();

var taskList = taskFinder.registerTasksFromDirectory('./tests/testTasksDir', app, function () {
    app.listen(3000);
});
