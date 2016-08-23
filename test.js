
let taskFinder = require('./index.js')
let express    = require('express')
let app        = express()

taskFinder.loadFromDirectory('./tests/testTasksDir', app, () => console.log('FINISHED'))
