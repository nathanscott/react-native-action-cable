var EventEmitter, Subscription;

EventEmitter = require('eventemitter3');

Subscription = (function() {
  var extend;

  class Subscription extends EventEmitter {
    constructor(consumer, params = {}, mixin) {
      super();
      this.consumer = consumer;
      // NOTE: THIS IS IMPORTANT TO INIT *_events* AND *_eventsCount* . CHECK THAT ALL IS OK
      // EventEmitter.call( @ )
      this.identifier = JSON.stringify(params);
      extend(this, mixin);
    }

    // Perform a channel action with the optional data passed as an attribute
    perform(action, data = {}) {
      data.action = action;
      return this.send(data);
    }

    send(data) {
      return this.consumer.send({
        command: 'message',
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    }

    unsubscribe() {
      return this.consumer.subscriptions.remove(this);
    }

    connected() {
      return this.emit('connected');
    }

    disconnected() {
      return this.emit('disconnected');
    }

    rejected() {
      return this.emit('rejected');
    }

    received(data) {
      data.action = data.action != null ? data.action : 'received';
      return this.emit(data.action, data);
    }

  };

  extend = function(object, properties) {
    var key, value;
    if (properties != null) {
      for (key in properties) {
        value = properties[key];
        object[key] = value;
      }
    }
    return object;
  };

  return Subscription;

}).call(this);

module.exports = Subscription;
