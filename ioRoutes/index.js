'use strict'

const UserRepo = require('../repos/UserRepo')
const log = require('debug')('dashboard:ioRoute/index')
const redisSub = require('../redisSub')
const io = require('../io')

redisSub.subscribe('dashboard', (err, count) => {
  log('subscribe result:', { err, count })
})

redisSub.on('message', async () => {
  const dashboard = await UserRepo.all()
  io.to('dashboard').emit('dashboard', dashboard)
})

module.exports = async socket => {
  socket.on('pingtest', () => {
    socket.emit('pongtest')
  })

  socket.join('dashboard')
}
