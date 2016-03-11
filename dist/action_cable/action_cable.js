var ActionCable, Consumer;

Consumer = require('./consumer');

ActionCable = {
  createConsumer: function(url, appComponent) {
    return new Consumer(this.createWebSocketURL(url), appComponent);
  },
  createWebSocketURL: function(url) {
    if (url && !/^wss?:/i.test(url)) {
      url = url.replace('http', 'ws');
    }
    return url;
  }
};

module.exports = ActionCable;
