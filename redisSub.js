const Redis = require('ioredis')
const _ = require('lodash')

module.exports = new Redis({
  host: _.get(process.env, ['REDIS_HOST'], 'redis'),
  port: _.get(process.env, ['REDIS_PORT'], 6379),
  family: 4,
  password: _.get(process.env, ['REDIS_PASSWORD'], null),
  db: _.get(process.env, ['REDIS_DB'], 0)
})
