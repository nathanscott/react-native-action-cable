Consumer = require('./consumer')

ActionCable =
  INTERNAL: require('./internal')
  WebSocket: window.WebSocket
  logger: window.console

  createConsumer: (url) ->
    new Consumer(@createWebSocketURL(url), @log, @WebSocket)

  createWebSocketURL: (url) ->
    if url and not /^wss?:/i.test(url)
      url = url.replace('http', 'ws')
    url

  startDebugging: ->
    @debugging = true

  stopDebugging: ->
    @debugging = null

  log: (messages...) =>
    if @debugging
      messages.push(Date.now())
      @logger.log("[ActionCable]", messages...)

module.exports = ActionCable
