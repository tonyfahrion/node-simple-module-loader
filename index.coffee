
walk = require('walk') # easy filesystem walking
path = require('path')
util = require('util')

modulesFound = []
express = undefined

# all extensions which could be modules
acceptedFileExtensions = ['js', 'coffee', 'litcoffee']

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
        return # not a module
    
    # register methods / routes in express
    task.routes.forEach((element) ->
        switch element.method
            when 'GET'  then express.get(element.route, element.call)
            when 'POST' then express.post(element.route, element.call)
            when 'PUT' then express.put(element.route, element.call)
            else
                console.log("[INFO] unknown http method, we don't support: %s within task: %s", element.method, filename)
                return
    )
    
    modulesFound.push(task)
    console.log('module loaded: %s', filename)
