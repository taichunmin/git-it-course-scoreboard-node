const redis = require('../redis')
const Promise = require('bluebird')
const log = require('debug')('dashboard:repos/UserRepo')
const _ = require('lodash')

const problemNames = [
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
  'MERGE TADA!'
]

let debouncePublish = null

class UserRepo {
  /**
   * 取得所有使用者資料
   * @return Promise(Array(Object))  使用者資料陣列
   */
  all () {
    return redis.smembers('user_mids')
      .then(userMids => {
        let promises = []
        _.each(userMids, userMid => {
          promises.push(
            redis.hgetall('user:' + userMid)
              .then(user => {
                if (!_.isNil(user.completed)) {
                  user.completed = JSON.parse(user.completed)
                }
                if (!_.isNil(user.current)) {
                  user.current = JSON.parse(user.current)
                }
                return user
              })
              .then(user => _.extend({
                owned: '0',
                mid: null,
                name: null,
                github: null,
                port: null,
                current: 0,
                completed: []
              }, user))
          )
        })
        return Promise.all(promises)
      }).then(users => _.filter(
        users,
        user => !_.isNil(user.mid)
      )).then(users => _.sortBy(users, [
        user => -user.completed.length,
        'port'
      ]))
  }

  /**
   * 批次寫入機器內使用者的資料
   * @param  Array(Object) users 使用者資料陣列
   * @return Promise
   */
  batchUpdate (users) {
    let promises = []
    _.each(users, user => {
      promises.push(this.update(user))
    })
    return Promise.all(promises)
  }

  /**
   * 寫入機器內使用者的資料
   * @param  Object user 使用者資料
   * @return Promise
   */
  update (user) {
    if (!_.isObject(user) || _.isNil(user.mid)) return 0

    // transform completed
    if (_.has(user, ['completed'])) {
      user.completed = JSON.parse(user.completed)
      user.completed = _.map(user.completed, problemName => (problemNames.indexOf(problemName) + 1))
      user.completed = JSON.stringify(user.completed)
    }

    if (_.has(user, ['current'])) {
      user.current = JSON.parse(user.current)
      user.current = problemNames.indexOf(user.current) + 1
    }

    user = _.pick(user, [
      'owned',
      'mid',
      'name',
      'github',
      'port',
      'completed',
      'current'
    ])

    return redis.pipeline()
      .hmset('user:' + user.mid, user)
      .sadd('user_mids', user.mid)
      .exec()
      .then(debouncePublish)
  }

  /**
   * 將 ports 寫入資料庫
   * @param  Object   ports 每個 mid 所對應的 ssh 外部 port
   * @return Promise
   */
  portsUpdate (ports) {
    return redis.smembers('user_mids')
      .then(userMids => _.difference(userMids, _.keys(ports)))
      .then(noportMids => {
        let promises = []
        _.each(ports, (port, mid) => {
          promises.push(this.update({
            mid,
            port
          }))
        })
        let redisPipeline = redis.pipeline()
        _.each(noportMids, mid => {
          redisPipeline.hdel('user:' + mid, 'port')
        })
        promises.push(redisPipeline.exec())
        return Promise.all(promises)
      }).then(debouncePublish)
  }

  /**
   * 請不要直接使用這個函式，請改用 debouncePublish
   * 將更新訊息推至 redis 的 dashboard 頻道內
   * @return Promise
   */
  publish () {
    return redis.publish('dashboard', 1)
  }

  /**
   * 回傳是否有指定的 mid 存在
   * @param  string        mid 機器的 mid
   * @return Promise(int)  {0: 不存在, 1:存在}
   */
  hasMid (mid) {
    return redis.sismember('user_mids', mid)
  }

  /**
   * 回傳是否有指定的 mid 存在且該 mid 有 port
   * @param  string        mid 機器的 mid
   * @return Promise(int)  {0: 不存在, 1:存在}
   */
  isMidHasPort (mid) {
    return this.hasMid(mid)
      .then(hasMid => {
        if (hasMid === 0) return 0
        return redis.hget('user:' + mid, 'port')
          .then(port => _.isInteger(_.parseInt(port)) ? 1 : 0)
      })
  }
}

module.exports = exports = new UserRepo()
debouncePublish = _.debounce(() => exports.publish(), 300)
