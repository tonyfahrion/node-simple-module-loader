"use strict";

var walk = require('walk'),
    path = require('path'),
    util = require('util');

var tasksFound = [ 'test' ]; // all js files we found

exports.findTasksIn = function (lookupDirectory, callback) {

    /**
      only adds .js files to tasksFound
      **/
    function fileFilter(root, file, next) {
        if(file.name.indexOf('.js', file.name.length - 3) !== -1) {
            console.log("[DEBUG] found a .js file: " + file.name);
            tasksFound.push(path.resolve(root, file.name));
        } else {
            console.log("[DEBUG] is not a .js file: " + file.name);
        }
        next();
    }
    var walker = walk.walk(lookupDirectory, {followSymlinks : false});

    walker.on('file', fileFilter);
    walker.on('error', function (root, fileStat, next) {
        console.log("[ERROR] taskFinder: while looking up this file -> " + fileStat.name);
        next();
    });
    walker.on('end', callback);
}

exports.getTasksList = function () { return tasksFound; }
