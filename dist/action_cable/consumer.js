var Connection, Consumer, Subscription, Subscriptions;

Connection = require('./connection');

Subscriptions = require('./subscriptions');

Subscription = require('./subscription');

Consumer = class Consumer {
  constructor(url, log, WebSocket) {
    this.url = url;
    this.log = log;
    this.WebSocket = WebSocket;
    this.subscriptions = new Subscriptions(this);
    this.connection = new Connection(this, this.log, this.WebSocket);
  }

  send(data) {
    return this.connection.send(data);
  }

  connect() {
    return this.connection.open();
  }

  disconnect() {
    return this.connection.close({
      allowReconnect: false
    });
  }

  ensureActiveConnection() {
    if (!this.connection.isActive()) {
      return this.connection.open();
    }
  }

};

module.exports = Consumer;
