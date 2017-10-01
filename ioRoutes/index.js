'use strict'

const UserRepo = require('../repos/UserRepo')
const log = require('debug')('dashboard:ioRoute/index')
const redisSub = require('../redisSub')
const io = require('../io')

redisSub.subscribe('dashboard', (err, count) => {
  log('subscribe result:', {err, count})
})

redisSub.on('message', function (channel, message) {
  UserRepo.all().then(dashboard => io.to('dashboard').emit('dashboard', dashboard))
})

module.exports = socket => {
  socket.on('pingtest', () => {
    socket.emit('pongtest')
  })

  socket.join('dashboard')

  UserRepo.all().then(dashboard => socket.emit('dashboard', dashboard))
}
