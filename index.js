"use strict";

var walk  = require('walk'),
    path  = require('path'),
    util  = require('util');

var tasksFound = [ ]; // all js files we found
var express; // our ref to the external express instance, given by registerTasksFromDirectory


/**
  check, if the given file ends on .js
  if so, add it to tasksFound and return true; else return false
  **/
function isJavascriptFile(filename) {
    if(filename.indexOf('.js', filename.length - 3) === -1) {
        console.log("[DEBUG] is not a .js file: " + filename);
        return false;
    }

    console.log("[DEBUG] found a .js file: " + filename);
    tasksFound.push(filename);
    return true;
}

/**
    Checks, if the js file has exported at least our required mehtods
        - taskRoute
        - taskMethods
        - one of runGetTask, runPostTask
    Will return the task module, if vaild, else undefined
    TODO: check for methods and available runMethodTask functions
**/
function checkTaskFile(filename) {
    console.log("[DEBUG] checking task file: " + filename);

    var task = require(filename);

    if( task.taskRoute === undefined ) {
        console.log("[WARN] task file check failed (missing function taskRoute) for " + filename);
        return;
    }

    if( task.taskMethods === undefined ) {
        console.log("[WARN] task file check failed (missing function taskMethods) for " + filename);
        return;
    }

    if( task.runGetTask === undefined && task.runPostTask === undefined ) {
        console.log("[WARN] task file check failed (missing function runGetTask or runPostTask) for " + filename);
        return;
    }
    return task;
}

function addTaskToExpress(task, file) {
    var route = task.taskRoute();
    if( typeof route !== 'string' || route == "") {
        console.log("[WARN] taskRoute returned an invalid type(" + typeof route + ") or empty string for task " + file);
        return false;
    }

    var methods = task.taskMethods();
    if( methods.constructor !== Array || methods.length == 0) {
        console.log("[WARN] taskMethods returned an invalid type(" + methods.constructor + ") or empty array for task " + file);
        return false;
    }

    methods.forEach(function (method) {
        switch (method) {
            case 'GET':
                console.log("[DEBUG] register runGetTask for " + file);
                express.get(route, task.runGetTask);
                break;
            case 'POST':
                console.log("[DEBUG] register runPostTask for " + file);
                express.post(route, task.runPostTask);
                break;
            default:
                console.log("[INFO] task exports a http method, we don't support: " + method + " within task: " + file);
        }
    });
    return true;
}

function registerTask(root, taskFile, next) {
    var file = path.resolve(root, taskFile.name);
    if(isJavascriptFile(file) === false) {
        console.log("[WARN] ignoring task " + file);
        next();
        return;
    }

    var task = checkTaskFile(file);
    if(task === undefined) {
        console.log("[WARN] ignoring task " + file);
        next();
        return;
    }

    if(addTaskToExpress(task, file) === false) {
        console.log("[WARN] ignoring task " + file);
        next();
        return;
    }
    console.log("[INFO] task registered (" + file + ")");
    next();
}

exports.registerTasksFromDirectory = function (lookupDirectory, expressInstance, callbackWhenFinished) {

    if( expressInstance === undefined ) {
        console.console.error("[ERROR] missing argument expressInstance");
        throw new Error.ReferenceError(this, 'expressInstance');
    }
    express = expressInstance;


    var walker = walk.walk(lookupDirectory, {followSymlinks : false});

    walker.on('file', registerTask);
    walker.on('error', function (root, fileStat, next) {
        console.log("[ERROR] taskFinder: while looking up this file -> " + fileStat.name);
        next();
    });
    walker.on('end', callbackWhenFinished);
}

exports.getTasksList = function () { return tasksFound; }
