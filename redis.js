const Redis = require('ioredis')
const _ = require('lodash')

module.exports = new Redis({
  db: _.get(process.env, ['REDIS_DB'], 0),
  family: 4,
  host: _.get(process.env, ['REDIS_HOST'], 'redis'),
  password: _.get(process.env, ['REDIS_PASSWORD'], null),
  port: _.get(process.env, ['REDIS_PORT'], 6379),
})
