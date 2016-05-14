
taskFinder = require('./index.coffee')
express    = require('express')

app = express()

taskFinder.loadFromDirectory('./tests/testTasksDir', app, ->
    console.log('FINISHED')
);
