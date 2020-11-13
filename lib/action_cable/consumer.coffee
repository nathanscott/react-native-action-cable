Connection = require('./connection').default
Subscriptions = require('./subscriptions').default


class Consumer
  constructor: (url, jwt, @log, @WebSocket) ->
    @subscriptions = new Subscriptions(@)
    @connection = new Connection(@, @log, @WebSocket)
    @jwt = jwt
    Object.defineProperty @, 'url', {
      get: () -> @createWebSocketURL(url),
      configurable: yes
    }

  send: (data) =>
    @connection.send(data)

  connect: =>
    @connection.open()

  disconnect: =>
    @connection.close(allowReconnect: false)

  ensureActiveConnection: =>
    unless @connection.isActive()
      @connection.open()

  createWebSocketURL: (url) ->
    url = url?() ? url

    if url and not /^wss?:/i.test(url)
      url = url.replace('http', 'ws')

    url

export default Consumer
