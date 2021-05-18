const express = require('express')
const router = express.Router()
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
  'MERGE TADA!',
]

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.render('index', {
    title: '課程儀表板',
    problems,
  })
})

router.post('/completed/update', async (req, res, next) => {
  try {
    log('/completed/update', req.body)
    await UserRepo.update(req.body)
    const isMidHasPort = await UserRepo.isMidHasPort(req.body.mid)
    if (!isMidHasPort) {
      const ports = await DockerApi.getAllClientSshPorts()
      log(ports)
      await UserRepo.portsUpdate(ports)
    }
    res.json({ result: 'OK' })
  } catch (err) {
    next(err)
  }
})

router.post('/ports/update', async (req, res, next) => {
  log('/ports/update', req.body)
  try {
    await UserRepo.portsUpdate(JSON.parse(req.body.ports))
    res.json({ result: 'OK' })
  } catch (err) {
    log(err)
    next(err)
  }
})

module.exports = router
