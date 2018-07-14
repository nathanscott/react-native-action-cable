EventEmitter = require('eventemitter3')

class Subscription extends EventEmitter
  constructor: (@consumer, params = {}, mixin) ->
    super()
    # NOTE: THIS IS IMPORTANT TO INIT *_events* AND *_eventsCount* . CHECK THAT ALL IS OK
    # EventEmitter.call( @ )

    @identifier = JSON.stringify(params)
    extend(@, mixin)

  # Perform a channel action with the optional data passed as an attribute
  perform: (action, data = {}) =>
    data.action = action
    @send(data)

  send: (data) =>
    @consumer.send(command: 'message', identifier: @identifier, data: JSON.stringify(data))

  unsubscribe: =>
    @consumer.subscriptions.remove(this)

  extend = (object, properties) ->
    if properties?
      for key, value of properties
        object[key] = value
    object

  connected: =>
    @emit('connected')

  disconnected: =>
    @emit('disconnected')

  rejected: =>
    @emit('rejected')

  received: (data) =>
    data.action = if data.action? then data.action else 'received'
    @emit(data.action, data)

module.exports = Subscription
