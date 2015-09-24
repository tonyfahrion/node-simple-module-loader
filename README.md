# taskFinder
A simple lookup for node "modules" within a specific directory

# The idea

The [express](http://expressjs.com) Framework is a great piece of software, easy to use and reliable.
I use the taskFinder module to lookup "tasks" within a directory, where one task is a javascript-node-module (so it has to be a .js file!).
After all js files are found, the taskFinder is able to create express routes for these "tasks" and will connect these tasks within express.


# What are tasks?

Each task can provide multiple methods and has to export at least 3 functions:

* taskRoute() // returns the route string, which is to be registered within express
* taskMethods() // returns an array of supported methods
* one of runGetTask(req, res), runPostTask(req, res) // handles the request itself
