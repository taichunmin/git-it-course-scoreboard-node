var express = require('express')
var router = express.Router()
const UserRepo = require('../repos/UserRepo')
const DockerApi = require('../repos/DockerApi')
const log = require('debug')('dashboard:route/index')

const problems = [
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

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: '課程儀表板',
    problems
  })
})

router.post('/completed/update', function (req, res, next) {
  log('/completed/update', req.body)
  return UserRepo.update(req.body)
    .then(() => UserRepo.isMidHasPort(req.body.mid))
    .then(isMidHasPort => {
      if (isMidHasPort === 1) return
      return DockerApi.getAllClientSshPorts()
        .tap(log)
        .then(ports => UserRepo.portsUpdate(ports))
    })
    .then(() => res.json({result: 'OK'}))
})

router.post('/ports/update', function (req, res, next) {
  log('/ports/update', req.body)
  try {
    return UserRepo.portsUpdate(JSON.parse(req.body.ports))
      .then(() => res.json({result: 'OK'}))
  } catch (e) {
    log(e)
  }
})

module.exports = router
