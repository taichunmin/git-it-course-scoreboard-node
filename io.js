'use strict'
const io = require('socket.io')()

io.on('connection', require('./ioRoutes/index'))

module.exports = io
