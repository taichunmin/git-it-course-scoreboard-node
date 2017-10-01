'use strict'
var io = require('socket.io')()

io.on('connection', function (socket) {
  require('./ioRoutes/index')(socket)
})

module.exports = io
