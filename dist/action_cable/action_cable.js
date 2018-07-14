var ActionCable, Consumer;

Consumer = require('./consumer');

ActionCable = {
  INTERNAL: require('./internal'),
  WebSocket: window.WebSocket,
  logger: window.console,
  createConsumer: function(url) {
    return new Consumer(this.createWebSocketURL(url), this.log, this.WebSocket);
  },
  createWebSocketURL: function(url) {
    if (url && !/^wss?:/i.test(url)) {
      url = url.replace('http', 'ws');
    }
    return url;
  },
  startDebugging: function() {
    return this.debugging = true;
  },
  stopDebugging: function() {
    return this.debugging = null;
  },
  log: function(...messages) {
    if (ActionCable.debugging) {
      messages.push(Date.now());
      return ActionCable.logger.log("[ActionCable]", ...messages);
    }
  }
};

module.exports = ActionCable;
