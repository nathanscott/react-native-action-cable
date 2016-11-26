var Connection, ConnectionMonitor, i, message_types, protocols, ref, supportedProtocols, unsupportedProtocol,
  slice = [].slice,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

ref = require('./internal'), message_types = ref.message_types, protocols = ref.protocols;

supportedProtocols = 2 <= protocols.length ? slice.call(protocols, 0, i = protocols.length - 1) : (i = 0, []), unsupportedProtocol = protocols[i++];

ConnectionMonitor = require('./connection_monitor');

Connection = (function() {
  Connection.reopenDelay = 500;

  function Connection(consumer, log, WebSocket1) {
    this.consumer = consumer;
    this.log = log;
    this.WebSocket = WebSocket1;
    this.open = bind(this.open, this);
    this.subscriptions = this.consumer.subscriptions;
    this.monitor = new ConnectionMonitor(this, this.log);
    this.disconnected = true;
  }

  Connection.prototype.send = function(data) {
    if (this.isOpen()) {
      this.webSocket.send(JSON.stringify(data));
      return true;
    } else {
      return false;
    }
  };

  Connection.prototype.open = function() {
    if (this.isActive()) {
      this.log("Attempted to open WebSocket, but existing socket is " + (this.getState()));
      throw new Error("Existing connection must be closed before opening");
    } else {
      this.log("Opening WebSocket, current state is " + (this.getState()) + ", subprotocols: " + protocols);
      if (this.webSocket != null) {
        this.uninstallEventHandlers();
      }
      this.webSocket = new this.WebSocket(this.consumer.url, protocols);
      this.webSocket.protocol = 'actioncable-v1-json';
      this.installEventHandlers();
      this.monitor.start();
      return true;
    }
  };

  Connection.prototype.close = function(arg) {
    var allowReconnect, ref1;
    allowReconnect = (arg != null ? arg : {
      allowReconnect: true
    }).allowReconnect;
    if (!allowReconnect) {
      this.monitor.stop();
    }
    if (this.isActive()) {
      return (ref1 = this.webSocket) != null ? ref1.close() : void 0;
    }
  };

  Connection.prototype.reopen = function() {
    var error;
    this.log("Reopening WebSocket, current state is " + (this.getState()));
    if (this.isActive()) {
      try {
        return this.close();
      } catch (error1) {
        error = error1;
        return this.log("Failed to reopen WebSocket", error);
      } finally {
        this.log("Reopening WebSocket in " + this.constructor.reopenDelay + "ms");
        setTimeout(this.open, this.constructor.reopenDelay);
      }
    } else {
      return this.open();
    }
  };

  Connection.prototype.getProtocol = function() {
    var ref1;
    return (ref1 = this.webSocket) != null ? ref1.protocol : void 0;
  };

  Connection.prototype.isOpen = function() {
    return this.isState("open");
  };

  Connection.prototype.isActive = function() {
    return this.isState("open", "connecting");
  };

  Connection.prototype.isProtocolSupported = function() {
    var ref1;
    return ref1 = this.getProtocol(), indexOf.call(supportedProtocols, ref1) >= 0;
  };

  Connection.prototype.isState = function() {
    var ref1, states;
    states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return ref1 = this.getState(), indexOf.call(states, ref1) >= 0;
  };

  Connection.prototype.getState = function() {
    var ref1, state, value;
    for (state in WebSocket) {
      value = WebSocket[state];
      if (value === ((ref1 = this.webSocket) != null ? ref1.readyState : void 0)) {
        return state.toLowerCase();
      }
    }
    return null;
  };

  Connection.prototype.installEventHandlers = function() {
    var eventName, handler;
    for (eventName in this.events) {
      handler = this.events[eventName].bind(this);
      this.webSocket["on" + eventName] = handler;
    }
  };

  Connection.prototype.uninstallEventHandlers = function() {
    var eventName;
    for (eventName in this.events) {
      this.webSocket["on" + eventName] = function() {};
    }
  };

  Connection.prototype.events = {
    message: function(event) {
      var identifier, message, ref1, type;
      if (!this.isProtocolSupported()) {
        return;
      }
      ref1 = JSON.parse(event.data), identifier = ref1.identifier, message = ref1.message, type = ref1.type;
      switch (type) {
        case message_types.welcome:
          this.monitor.recordConnect();
          return this.subscriptions.reload();
        case message_types.ping:
          return this.monitor.recordPing();
        case message_types.confirmation:
          return this.subscriptions.notify(identifier, "connected");
        case message_types.rejection:
          return this.subscriptions.reject(identifier);
        default:
          return this.subscriptions.notify(identifier, "received", message);
      }
    },
    open: function() {
      this.log("WebSocket onopen event, using '" + (this.getProtocol()) + "' subprotocol");
      this.disconnected = false;
      if (!this.isProtocolSupported()) {
        this.log("Protocol is unsupported. Stopping monitor and disconnecting.");
        return this.close({
          allowReconnect: false
        });
      }
    },
    close: function(event) {
      this.log("WebSocket onclose event");
      if (this.disconnected) {
        return;
      }
      this.disconnected = true;
      this.monitor.recordDisconnect();
      return this.subscriptions.notifyAll("disconnected", {
        willAttemptReconnect: this.monitor.isRunning()
      });
    },
    error: function() {
      return this.log("WebSocket onerror event");
    }
  };

  return Connection;

})();

module.exports = Connection;
