const _ = require('lodash')
const redis = require('../redis')

const problemNames = _.fromPairs(_.map([
  'GET GIT',
  'REPOSITORY',
  'COMMIT TO IT',
  'GITHUBBIN',
  'REMOTE CONTROL',
  'FORKS AND CLONES',
  "BRANCHES AREN'T JUST FOR BIRDS",
  "IT'S A SMALL WORLD",
  'PULL, NEVER OUT OF DATE',
  'REQUESTING YOU PULL, PLEASE',
  'MERGE TADA!',
], (v, k) => [v, k + 1]))

/**
 * 取得所有使用者資料
 * @return Promise(Array(Object))  使用者資料陣列
 */
exports.all = async () => {
  const userMids = await redis.smembers('user_mids')
  const users = await Promise.all(_.map(userMids, async userMid => {
    const user = await redis.hgetall('user:' + userMid)
    if (!user) return
    return {
      completed: [],
      current: 0,
      github: null,
      mid: null,
      name: null,
      owned: '0',
      port: null,
      ...user,
    }
  }))
  return _.orderBy(_.filter(users), ['completed.length', 'port'], ['desc', 'asc'])
}

/**
 * 將更新訊息推至 redis 的 dashboard 頻道內
 */
exports.debouncePublish = _.debounce(() => redis.publish('dashboard', 1), 300)

/**
 * 寫入機器內使用者的資料
 * @param  Object user 使用者資料
 * @return Promise
 */
exports.update = async user => {
  if (!_.isObject(user) || _.isNil(user.mid)) return

  // transform completed
  if (_.has(user, ['completed'])) {
    let completed = JSON.parse(user.completed)
    completed = _.map(completed, problemName => _.get(problemNames, problemName))
    user.completed = JSON.stringify(completed)
  }

  if (_.has(user, ['current'])) {
    user.current = JSON.parse(user.current)
    user.current = _.get(problemNames, user.current)
  }

  user = _.pick(user, [
    'completed',
    'current',
    'github',
    'mid',
    'name',
    'owned',
    'port',
  ])

  await redis.pipeline()
    .hmset('user:' + user.mid, user)
    .sadd('user_mids', user.mid)
    .exec()

  exports.debouncePublish()
}

/**
 * 批次寫入機器內使用者的資料
 * @param  Array(Object) users 使用者資料陣列
 * @return Promise
 */
exports.batchUpdate = async users => {
  return await Promise.all(_.map(users, exports.update))
}

/**
 * 將 ports 寫入資料庫
 * @param  Object   ports 每個 mid 所對應的 ssh 外部 port
 * @return Promise
 */
exports.portsUpdate = async ports => {
  const noportMids = _.difference(await redis.smembers('user_mids'), _.keys(ports))
  const pipeline = redis.pipeline()
  _.each(noportMids, mid => pipeline.hdel('user:' + mid, 'port'))

  await Promise.all([
    pipeline.exec(),
    ..._.map(ports, (port, mid) => exports.update({ mid, port })),
  ])
  exports.debouncePublish()
}

/**
 * 回傳是否有指定的 mid 存在
 * @param  string        mid 機器的 mid
 * @return Promise(int)  {0: 不存在, 1:存在}
 */
exports.hasMid = async mid => {
  return await redis.sismember('user_mids', mid)
}

/**
 * 回傳是否有指定的 mid 存在且該 mid 有 port
 * @param  string        mid 機器的 mid
 * @return Promise(int)  {0: 不存在, 1:存在}
 */
exports.isMidHasPort = async mid => {
  const hasMid = await exports.hasMid(mid)
  if (!hasMid) return false
  const port = await redis.hget('user:' + mid, 'port')
  return !!_.toSafeInteger(port)
}
