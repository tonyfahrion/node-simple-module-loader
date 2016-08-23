
const walk = require('walk') // easy filesystem walking
const path = require('path')
require('coffee-script').register() // for coffee-script support

var modulesFound = []
var express = undefined

// all extensions which could be modules
const acceptedFileExtensions = ['js', 'coffee', 'litcoffee']

/*
stores validator functions; each loaded module can optionaly support validation. This is our validation cache...
    req.route.path:
        required:
            id: (value) -> return isInt(value)
        optional:
            name: (value) -> name.length > 2
*/
var routeValidators = {}

module.exports = {
    loadFromDirectory: (directory, expressInstance, callbackWhenFinished) => {
        if(expressInstance === undefined) {
            console.console.error("[ERROR] missing argument expressInstance")
            throw new Error.ReferenceError(this, 'expressInstance')
        }
        express = expressInstance

        let walker = walk.walk(directory, {followSymlinks : false})
        walker.on('file', (root, fileStat, nextFile) => {
            loadFile(path.resolve(root, fileStat.name))
            nextFile()
        })
        walker.on('error', (root, fileStat, nextFile) => {
            console.log("[ERROR] taskFinder: while looking up this file -> %s", fileStat.name)
            nextFile()
        })
        walker.on('end', callbackWhenFinished)
    },
    getLoadedModules: () => modulesFound
}


/*
Checks, if the js file has exported at least our required mehtods
    - taskRoute
    - taskMethods
    - one of runGetTask, runPostTask
Will return the task module, if vaild, else undefined
TODO: check for methods and available runMethodTask functions
*/
var loadFile = (filename) => {
    console.log('[DEBUG] checking task file: %s', filename);

    if(acceptedFileExtensions.indexOf(filename.split('.').pop()) < 0) {
        console.log('[WARN] ignore file, its file extension is unsupported: %s', filename.split('.').pop())
        return false
    }

    let task = require(filename)
    if(task.description !== undefined)
        console.log('Loading task: %s', task.description)
    
    if(task.routes === undefined)
        return console.log('[DEBUG] ignore file, no routes configured') // not a module, ignore
    
    task.routes.forEach( (element) => addRouteToExpress(element) ) // register methods / routes in express
    modulesFound.push(task)
    console.log('module loaded: %s', filename)
}


/*
ignores unknown params in req.body
checks only body parameters
needs to be public, so it can be called by express
*/
var prevalidateRequest = (req, res, next) => {
    let route = routeValidators[req.route.path]
    if(req.body === undefined && route.required !== undefined) {// if no params are send, check if we have a required field
        req.app.log.warn({action: 'prevalidate_request', details: {msg: 'param_missing', param: Object.keys(route.required), got: req.body}})
        return res.json({rc: 400, msg: 'param_missing', param: Object.keys(route.required)})
    }
    
    let params_failed = [] // add param, if validation failed...
    if(route.required !== undefined)
        for(let [param_name, param_validator] of route.required)
            if(req.body[param_name] !== undefined || param_validator(req.body[param_name]) == false)
                params_failed.push(param_name + ' (required)')
    
    if(route.optional !== undefined)
        for(let [param_name, param_validator] of route.optional)
            if(req.body[param_name] !== undefined)
                if(param_validator(req.body[param_name]) == false)
                    params_failed.push(param_name + ' (optional)')
    
    if(params_failed !== undefined) {
        req.app.log.warn({action: 'prevalidate_request', details: {msg: 'param_missing_or_invalid', params_failed: params_failed, params: req.body}})
        return res.json({rc: 400, msg: 'param_missing_or_invalid', params_failed: params_failed})
    }
    
    return next()
}


var addRouteToExpress = (element) => {
  console.log('[DEBUG] adding element ', element.route)
    if(['GET', 'POST', 'PUT'].indexOf(element.method) < 0)
        return console.error('[ERROR] got invalid method: ', element)
    
    if(element.params !== undefined) {
        routeValidators[element.route] = element.params
        express[element.method.toLowerCase()](element.route, prevalidateRequest)
    }
    express[element.method.toLowerCase()](element.route, element.call)
}
