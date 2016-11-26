var EventEmitter, Subscription,
  extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require('eventemitter3');

Subscription = (function(superClass) {
  var extend;

  extend1(Subscription, superClass);

  function Subscription(consumer, params, mixin) {
    this.consumer = consumer;
    if (params == null) {
      params = {};
    }
    EventEmitter.call(this);
    this.identifier = JSON.stringify(params);
    extend(this, mixin);
  }

  Subscription.prototype.perform = function(action, data) {
    if (data == null) {
      data = {};
    }
    data.action = action;
    return this.send(data);
  };

  Subscription.prototype.send = function(data) {
    return this.consumer.send({
      command: 'message',
      identifier: this.identifier,
      data: JSON.stringify(data)
    });
  };

  Subscription.prototype.unsubscribe = function() {
    return this.consumer.subscriptions.remove(this);
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

  Subscription.prototype.connected = function() {
    return this.emit('connected');
  };

  Subscription.prototype.disconnected = function() {
    return this.emit('disconnected');
  };

  Subscription.prototype.rejected = function() {
    return this.emit('rejected');
  };

  Subscription.prototype.received = function(data) {
    data.action = data.action != null ? data.action : 'received';
    return this.emit(data.action, data);
  };

  return Subscription;

})(EventEmitter);

module.exports = Subscription;
