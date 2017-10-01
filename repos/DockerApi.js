'use strict'

/**
 * curl --unix-socket /var/run/docker.sock http:/v1.24/containers/json
 */

const log = require('debug')('dashboard:repos/DockerApi')
const RequestPromise = require('request-promise')
const _ = require('lodash')

/**
 * docker host 的基本路徑
 */
const DOCKER_BASEURL = _.get(process.env, ['DOCKER_BASEURL'], 'http://unix:/var/run/docker.sock:')

/**
 * 設定 request-promise 的預設值
 */
let rp = RequestPromise.defaults({
  baseUrl: DOCKER_BASEURL,
  // debug: true,
  followRedirect: true,
  followAllRedirects: true,
  encoding: 'utf8',
  transform: body => JSON.parse(body)
})

class DockerApi {
  getAllClientSshPorts () {
    return rp({
      uri: '/v1.24/containers/json',
      method: 'GET',
      headers: {
        Host: 'localhost'
      },
      qs: {
        filters: '{"label":["role=git-it-client"]}'
      }
    }).then(containers => {
      if (!_.isArray(containers)) {
        log(containers)
        return
      }
      let ports = {}
      _.each(containers, container => {
        let mid = container.Id.substr(0, 12)
        _.each(container.Ports, containerPort => {
          if (containerPort.PrivatePort === 22) {
            ports[mid] = containerPort.PublicPort
          }
        })
      })
      return ports
    })
  }
}

module.exports = new DockerApi()
