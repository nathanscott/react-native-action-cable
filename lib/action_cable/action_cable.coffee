Consumer = require('./consumer')

ActionCable =
  createConsumer: (url, appComponent) ->
    new Consumer(@createWebSocketURL(url), appComponent)

  createWebSocketURL: (url) ->
    if url and not /^wss?:/i.test(url)
      url = url.replace('http', 'ws')
    url

module.exports = ActionCable
