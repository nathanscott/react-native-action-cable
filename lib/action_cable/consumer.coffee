Connection = require('./connection')
Subscriptions = require('./subscriptions')
Subscription = require('./subscription')

class Consumer
  constructor: (@url) ->
    @subscriptions = new Subscriptions(@)
    @connection = new Connection(@)

  send: (data) ->
    @connection.send(data)

  connect: ->
    @connection.open()

  disconnect: ->
    @connection.close(allowReconnect: false)

  ensureActiveConnection: ->
    unless @connection.isActive()
      @connection.open()

module.exports = Consumer
