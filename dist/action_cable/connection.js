var Connection, ConnectionMonitor, message_types, protocols, supportedProtocols, unsupportedProtocol,
  splice = [].splice,
  indexOf = [].indexOf;

({message_types, protocols} = require('./internal'));

[...supportedProtocols] = protocols, [unsupportedProtocol] = splice.call(supportedProtocols, -1);

ConnectionMonitor = require('./connection_monitor');

Connection = (function() {
  class Connection {
    constructor(consumer, log, WebSocket1) {
      this.open = this.open.bind(this);
      this.consumer = consumer;
      this.log = log;
      this.WebSocket = WebSocket1;
      ({subscriptions: this.subscriptions} = this.consumer);
      this.monitor = new ConnectionMonitor(this, this.log);
      this.disconnected = true;
    }

    send(data) {
      if (this.isOpen()) {
        this.webSocket.send(JSON.stringify(data));
        return true;
      } else {
        return false;
      }
    }

    open() {
      if (this.isActive()) {
        this.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
        return false;
      } else {
        this.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${protocols}`);
        if (this.webSocket != null) {
          this.uninstallEventHandlers();
        }
        this.webSocket = new this.WebSocket(this.consumer.url, protocols);
        // NOTE: TEMP FIX FOR IOS. SEE https://github.com/facebook/react-native/issues/6137
        this.webSocket.protocol = 'actioncable-v1-json';
        this.installEventHandlers();
        this.monitor.start();
        return true;
      }
    }

    close({allowReconnect} = {
        allowReconnect: true
      }) {
      var ref;
      if (!allowReconnect) {
        this.monitor.stop();
      }
      if (this.isActive()) {
        return (ref = this.webSocket) != null ? ref.close() : void 0;
      }
    }

    reopen() {
      var error;
      this.log(`Reopening WebSocket, current state is ${this.getState()}`);
      if (this.isActive()) {
        try {
          return this.close();
        } catch (error1) {
          error = error1;
          return this.log("Failed to reopen WebSocket", error);
        } finally {
          this.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
          setTimeout(this.open, this.constructor.reopenDelay);
        }
      } else {
        return this.open();
      }
    }

    getProtocol() {
      var ref;
      return (ref = this.webSocket) != null ? ref.protocol : void 0;
    }

    isOpen() {
      return this.isState("open");
    }

    isActive() {
      return this.isState("open", "connecting");
    }

    // Private
    isProtocolSupported() {
      var ref;
      return ref = this.getProtocol(), indexOf.call(supportedProtocols, ref) >= 0;
    }

    isState(...states) {
      var ref;
      return ref = this.getState(), indexOf.call(states, ref) >= 0;
    }

    getState() {
      var ref, state, value;
      for (state in WebSocket) {
        value = WebSocket[state];
        if (value === ((ref = this.webSocket) != null ? ref.readyState : void 0)) {
          return state.toLowerCase();
        }
      }
      return null;
    }

    installEventHandlers() {
      var eventName, handler;
      for (eventName in this.events) {
        handler = this.events[eventName].bind(this);
        this.webSocket[`on${eventName}`] = handler;
      }
    }

    uninstallEventHandlers() {
      var eventName;
      for (eventName in this.events) {
        this.webSocket[`on${eventName}`] = function() {};
      }
    }

  };

  Connection.reopenDelay = 500;

  Connection.prototype.events = {
    message: function(event) {
      var identifier, message, type;
      if (!this.isProtocolSupported()) {
        if (event.data.close != null) {
          event.data.close();
        }
        return;
      }
      ({identifier, message, type} = JSON.parse(event.data));
      if (event.data.close != null) {
        event.data.close();
      }
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
      this.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
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

}).call(this);

module.exports = Connection;
