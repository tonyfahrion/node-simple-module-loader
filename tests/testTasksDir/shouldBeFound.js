
exports.taskRoute = function () { return '/'; }

exports.taskMethods = function () { return [ 'GET', 'PUT' ]; }

exports.runGetTask = function (request, respond) {
    respond.send("It works!");
}
