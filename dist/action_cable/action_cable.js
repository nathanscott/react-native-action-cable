var ActionCable, Consumer,
  slice = [].slice;

Consumer = require('./consumer');

ActionCable = {
  INTERNAL: require('./internal'),
  WebSocket: window.WebSocket,
  logger: window.console,
  createConsumer: function(url) {
    return new Consumer(this.createWebSocketURL(url));
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
  log: function() {
    var messages, ref;
    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (this.debugging) {
      messages.push(Date.now());
      return (ref = this.logger).log.apply(ref, ["[ActionCable]"].concat(slice.call(messages)));
    }
  }
};

module.exports = ActionCable;
