var AppState, ConnectionMonitor;

({AppState} = require('react-native'));

ConnectionMonitor = (function() {
  var clamp, now, secondsSince;

  class ConnectionMonitor {
    constructor(connection, log) {
      this.visibilityDidChange = this.visibilityDidChange.bind(this);
      this.connection = connection;
      this.log = log;
      this.reconnectAttempts = 0;
    }

    start() {
      if (!this.isRunning()) {
        this.startedAt = now();
        delete this.stoppedAt;
        this.startPolling();
        AppState.addEventListener("change", this.visibilityDidChange);
        return this.log(`ConnectionMonitor started. pollInterval = ${this.getPollInterval()} ms`);
      }
    }

    stop() {
      if (this.isRunning()) {
        this.stoppedAt = now();
        this.stopPolling();
        AppState.removeEventListener("change", this.visibilityDidChange);
        return this.log("ConnectionMonitor stopped");
      }
    }

    isRunning() {
      return (this.startedAt != null) && (this.stoppedAt == null);
    }

    recordPing() {
      return this.pingedAt = now();
    }

    recordConnect() {
      this.reconnectAttempts = 0;
      this.recordPing();
      delete this.disconnectedAt;
      return this.log("ConnectionMonitor recorded connect");
    }

    recordDisconnect() {
      this.disconnectedAt = now();
      return this.log("ConnectionMonitor recorded disconnect");
    }

    // Private
    startPolling() {
      this.stopPolling();
      return this.poll();
    }

    stopPolling() {
      return clearTimeout(this.pollTimeout);
    }

    poll() {
      return this.pollTimeout = setTimeout(() => {
        this.reconnectIfStale();
        return this.poll();
      }, this.getPollInterval());
    }

    getPollInterval() {
      var interval, max, min;
      ({min, max} = this.constructor.pollInterval);
      interval = 5 * Math.log(this.reconnectAttempts + 1);
      return Math.round(clamp(interval, min, max) * 1000);
    }

    reconnectIfStale() {
      if (this.connectionIsStale()) {
        this.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, pollInterval = ${this.getPollInterval()} ms, time disconnected = ${secondsSince(this.disconnectedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
        this.reconnectAttempts++;
        if (this.disconnectedRecently()) {
          return this.log("ConnectionMonitor skipping reopening recent disconnect");
        } else {
          this.log("ConnectionMonitor reopening");
          return this.connection.reopen();
        }
      }
    }

    connectionIsStale() {
      var ref;
      return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.constructor.staleThreshold;
    }

    disconnectedRecently() {
      return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
    }

    visibilityDidChange() {
      if (AppState.currentState === "active") {
        return setTimeout(() => {
          if (this.connectionIsStale() || !this.connection.isOpen()) {
            this.log(`ConnectionMonitor reopening stale connection on change. visbilityState = ${AppState.currentState}`);
            return this.connection.reopen();
          }
        }, 200);
      }
    }

  };

  ConnectionMonitor.pollInterval = {
    min: 3,
    max: 30
  };

  ConnectionMonitor.staleThreshold = 6; // Server::Connections::BEAT_INTERVAL * 2 (missed two pings)

  now = function() {
    return new Date().getTime();
  };

  secondsSince = function(time) {
    return (now() - time) / 1000;
  };

  clamp = function(number, min, max) {
    return Math.max(min, Math.min(max, number));
  };

  return ConnectionMonitor;

}).call(this);

module.exports = ConnectionMonitor;
