"use strict";

var taskFinder = require('./index.js');

var taskList = taskFinder.findTasksIn('./tests/testTasksDir', function () {
    console.log("result1: " + taskFinder.getTasksList().toString());
});
