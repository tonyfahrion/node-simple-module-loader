
walk = require('walk') # easy filesystem walking
path = require('path')

modulesFound = []
express = undefined

# all extensions which could be modules
acceptedFileExtensions = ['js', 'coffee', 'litcoffee']

###
stores validator functions; each loaded module can optionaly support validation. This is our validation cache...
    req.route.path:
        required:
            id: (value) -> return isInt(value)
        optional:
            name: (value) -> name.length > 2
###
routeValidators = {}

module.exports = {
    loadFromDirectory: (directory, expressInstance, callbackWhenFinished) ->
        if expressInstance is undefined
            console.console.error("[ERROR] missing argument expressInstance")
            throw new Error.ReferenceError(this, 'expressInstance')
        express = expressInstance

        walker = walk.walk(directory, {followSymlinks : false})
        walker.on('file', (root, fileStat, nextFile) ->
            loadFile(path.resolve(root, fileStat.name))
            nextFile()
        )
        walker.on('error', (root, fileStat, nextFile) ->
            console.log("[ERROR] taskFinder: while looking up this file -> %s", fileStat.name)
            nextFile()
        )
        walker.on('end', callbackWhenFinished)
    
    getLoadedModules: -> return modulesFound
}


###
Checks, if the js file has exported at least our required mehtods
    - taskRoute
    - taskMethods
    - one of runGetTask, runPostTask
Will return the task module, if vaild, else undefined
TODO: check for methods and available runMethodTask functions
###
loadFile = (filename) ->
    console.log('[DEBUG] checking task file: %s', filename);

    if filename.split('.').pop() not in acceptedFileExtensions
        console.log('[WARN] ignore file, its file extension is unsupported: %s', filename.split('.').pop())
        return false

    task = require(filename)
    console.log('Loading task: %s', task.description) if task.description?
    
    if not task.routes?
        return # not a module, ignore
    
    # register methods / routes in express
    task.routes.forEach((element) ->
        addRouteToExpress(element)
    )
    
    modulesFound.push(task)
    console.log('module loaded: %s', filename)



###
ignores unknown params in req.body
checks only body parameters
needs to be public, so it can be called by express
###
prevalidateRequest = (req, res, next) ->
    route = routeValidators[req.route.path]
    if not req.body? and route.required? # if no params are send, check if we have a required field
        req.app.log.warn({action: 'prevalidate_request', details: {msg: 'param_missing', param: Object.keys(route.required), got: req.body}})
        return res.json({rc: 400, msg: 'param_missing', param: Object.keys(route.required)})
    
    params_failed = [] # add param, if validation failed...
    if route.required?
        for param_name, param_validator of route.required
            if not req.body[param_name]? or param_validator(req.body[param_name]) == false
                params_failed.push(param_name + ' (required)')
    if route.optional?
        for param_name, param_validator of route.optional
            if req.body[param_name]?
                if param_validator(req.body[param_name]) == false
                    params_failed.push(param_name + ' (optional)')
    if params_failed?
        req.app.log.warn({action: 'prevalidate_request', details: {msg: 'param_missing_or_invalid', params_failed: params_failed, params: req.body}})
        return res.json({rc: 400, msg: 'param_missing_or_invalid', params_failed: params_failed})
    
    return next()


addRouteToExpress = (element) ->
    if element.method not in ['GET', 'POST', 'PUT']
        return console.error('[ERROR] got invalid method: ', element)
    
    if element.params?
        routeValidators[element.route] = element.params
        express[element.method.toLowerCase()](element.route, prevalidateRequest)
    express[element.method.toLowerCase()](element.route, element.call)
