{ AppState } = require('react-native')
ActionCable = require('./action_cable')

class ConnectionMonitor
  @pollInterval:
    min: 3
    max: 30

  @staleThreshold: 6 # Server::Connections::BEAT_INTERVAL * 2 (missed two pings)

  constructor: (@connection) ->
    @reconnectAttempts = 0

  start: ->
    unless @isRunning()
      @startedAt = now()
      delete @stoppedAt
      @startPolling()
      AppState.addEventListener("change", @visibilityDidChange)
      ActionCable.log("ConnectionMonitor started. pollInterval = #{@getPollInterval()} ms")

  stop: ->
    if @isRunning()
      @stoppedAt = now()
      @stopPolling()
      AppState.removeEventListener("change", @visibilityDidChange)
      ActionCable.log("ConnectionMonitor stopped")

  isRunning: ->
    @startedAt? and not @stoppedAt?

  recordPing: ->
    @pingedAt = now()

  recordConnect: ->
    @reconnectAttempts = 0
    @recordPing()
    delete @disconnectedAt
    ActionCable.log("ConnectionMonitor recorded connect")

  recordDisconnect: ->
    @disconnectedAt = now()
    ActionCable.log("ConnectionMonitor recorded disconnect")

  # Private

  startPolling: ->
    @stopPolling()
    @poll()

  stopPolling: ->
    clearTimeout(@pollTimeout)

  poll: ->
    @pollTimeout = setTimeout =>
      @reconnectIfStale()
      @poll()
    , @getPollInterval()

  getPollInterval: ->
    {min, max} = @constructor.pollInterval
    interval = 5 * Math.log(@reconnectAttempts + 1)
    Math.round(clamp(interval, min, max) * 1000)

  reconnectIfStale: ->
    if @connectionIsStale()
      ActionCable.log("ConnectionMonitor detected stale connection. reconnectAttempts = #{@reconnectAttempts}, pollInterval = #{@getPollInterval()} ms, time disconnected = #{secondsSince(@disconnectedAt)} s, stale threshold = #{@constructor.staleThreshold} s")
      @reconnectAttempts++
      if @disconnectedRecently()
        ActionCable.log("ConnectionMonitor skipping reopening recent disconnect")
      else
        ActionCable.log("ConnectionMonitor reopening")
        @connection.reopen()

  connectionIsStale: ->
    secondsSince(@pingedAt ? @startedAt) > @constructor.staleThreshold

  disconnectedRecently: ->
    @disconnectedAt and secondsSince(@disconnectedAt) < @constructor.staleThreshold

  visibilityDidChange: =>
    if AppState.currentState is "active"
      setTimeout =>
        if @connectionIsStale() or not @connection.isOpen()
          ActionCable.log("ConnectionMonitor reopening stale connection on change. visbilityState = #{AppState.currentState}")
          @connection.reopen()
      , 200

  now = ->
    new Date().getTime()

  secondsSince = (time) ->
    (now() - time) / 1000

  clamp = (number, min, max) ->
    Math.max(min, Math.min(max, number))

module.exports = ConnectionMonitor
