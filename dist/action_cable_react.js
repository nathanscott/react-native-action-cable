/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	window.ActionCableReact = {
	  ActionCable: __webpack_require__(1),
	  Cable: __webpack_require__(9),
	  CableMixin: __webpack_require__(10),
	  ChannelMixin: __webpack_require__(11),
	  version: __webpack_require__(14)
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var ActionCable, Consumer;

	Consumer = __webpack_require__(2);

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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var Connection, ConnectionMonitor, Consumer, Subscription, Subscriptions;

	Connection = __webpack_require__(3);

	ConnectionMonitor = __webpack_require__(5);

	Subscriptions = __webpack_require__(6);

	Subscription = __webpack_require__(7);

	Consumer = (function() {
	  function Consumer(url, appComponent) {
	    this.url = url;
	    this.appComponent = appComponent;
	    this.subscriptions = new Subscriptions(this);
	    this.connection = new Connection(this);
	    this.connectionMonitor = new ConnectionMonitor(this);
	  }

	  Consumer.prototype.send = function(data) {
	    return this.connection.send(data);
	  };

	  Consumer.prototype.inspect = function() {
	    return JSON.stringify(this, null, 2);
	  };

	  Consumer.prototype.toJSON = function() {
	    return {
	      url: this.url,
	      subscriptions: this.subscriptions,
	      connection: this.connection,
	      connectionMonitor: this.connectionMonitor
	    };
	  };

	  return Consumer;

	})();

	module.exports = Consumer;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Connection, message_types,
	  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
	  slice = [].slice,
	  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	message_types = __webpack_require__(4).message_types;

	Connection = (function() {
	  Connection.reopenDelay = 500;

	  function Connection(consumer) {
	    this.consumer = consumer;
	    this.open = bind(this.open, this);
	    this.open();
	  }

	  Connection.prototype.send = function(data) {
	    console.log("Connection: send " + data);
	    if (this.isOpen()) {
	      this.webSocket.send(JSON.stringify(data));
	      return true;
	    } else {
	      return false;
	    }
	  };

	  Connection.prototype.open = function() {
	    console.log("Connection: open");
	    if (this.webSocket && !this.isState('closed')) {
	      console.log("Connection: open 1");
	      throw new Error('Existing connection must be closed before opening');
	    } else {
	      console.log("Connection: open 2");
	      this.webSocket = new WebSocket(this.consumer.url);
	      this.installEventHandlers();
	      return true;
	    }
	  };

	  Connection.prototype.close = function() {
	    var ref;
	    return (ref = this.webSocket) != null ? ref.close() : void 0;
	  };

	  Connection.prototype.reopen = function() {
	    if (this.isState('closed')) {
	      return this.open();
	    } else {
	      try {
	        return this.close();
	      } finally {
	        setTimeout(this.open, this.constructor.reopenDelay);
	      }
	    }
	  };

	  Connection.prototype.isOpen = function() {
	    return this.isState('open');
	  };

	  Connection.prototype.isState = function() {
	    var ref, states;
	    states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	    return ref = this.getState(), indexOf.call(states, ref) >= 0;
	  };

	  Connection.prototype.getState = function() {
	    var ref, state, value;
	    for (state in WebSocket) {
	      value = WebSocket[state];
	      if (value === ((ref = this.webSocket) != null ? ref.readyState : void 0)) {
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

	  Connection.prototype.events = {
	    message: function(event) {
	      var identifier, message, ref, type;
	      ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message, type = ref.type;
	      switch (type) {
	        case message_types.confirmation:
	          return this.consumer.subscriptions.notify(identifier, 'connected');
	        case message_types.rejection:
	          return this.consumer.subscriptions.reject(identifier);
	        default:
	          return this.consumer.subscriptions.notify(identifier, 'received', message);
	      }
	    },
	    open: function() {
	      this.disconnected = false;
	      return this.consumer.subscriptions.reload();
	    },
	    close: function() {
	      return this.disconnect();
	    },
	    error: function() {
	      return this.disconnect();
	    }
	  };

	  Connection.prototype.disconnect = function() {
	    if (this.disconnected) {
	      return;
	    }
	    this.disconnected = true;
	    return this.consumer.subscriptions.notifyAll('disconnected');
	  };

	  Connection.prototype.toJSON = function() {
	    return {
	      state: this.getState()
	    };
	  };

	  return Connection;

	})();

	module.exports = Connection;


/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = {
	  identifiers: {
	    ping: '_ping'
	  },
	  message_types: {
	    confirmation: 'confirm_subscription',
	    rejection: 'reject_subscription'
	  }
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var ConnectionMonitor, INTERNAL,
	  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	INTERNAL = __webpack_require__(4);

	ConnectionMonitor = (function() {
	  var clamp, now, secondsSince;

	  ConnectionMonitor.pollInterval = {
	    min: 3,
	    max: 30
	  };

	  ConnectionMonitor.staleThreshold = 6;

	  ConnectionMonitor.prototype.identifier = INTERNAL.identifiers.ping;

	  function ConnectionMonitor(consumer) {
	    this.consumer = consumer;
	    this.visibilityDidChange = bind(this.visibilityDidChange, this);
	    this.consumer.subscriptions.add(this);
	    this.start();
	  }

	  ConnectionMonitor.prototype.connected = function() {
	    this.reset();
	    this.pingedAt = now();
	    return delete this.disconnectedAt;
	  };

	  ConnectionMonitor.prototype.disconnected = function() {
	    return this.disconnectedAt = now();
	  };

	  ConnectionMonitor.prototype.received = function() {
	    return this.pingedAt = now();
	  };

	  ConnectionMonitor.prototype.reset = function() {
	    return this.reconnectAttempts = 0;
	  };

	  ConnectionMonitor.prototype.start = function() {
	    this.reset();
	    delete this.stoppedAt;
	    this.startedAt = now();
	    this.poll();
	    return console.log('subscribe');
	  };

	  ConnectionMonitor.prototype.stop = function() {
	    this.stoppedAt = now();
	    return console.log('un-subscribe');
	  };

	  ConnectionMonitor.prototype.poll = function() {
	    return setTimeout((function(_this) {
	      return function() {
	        if (!_this.stoppedAt) {
	          _this.reconnectIfStale();
	          return _this.poll();
	        }
	      };
	    })(this), this.getInterval());
	  };

	  ConnectionMonitor.prototype.getInterval = function() {
	    var interval, max, min, ref;
	    ref = this.constructor.pollInterval, min = ref.min, max = ref.max;
	    interval = 5 * Math.log(this.reconnectAttempts + 1);
	    return clamp(interval, min, max) * 1000;
	  };

	  ConnectionMonitor.prototype.reconnectIfStale = function() {
	    if (this.connectionIsStale()) {
	      this.reconnectAttempts++;
	      if (!this.disconnectedRecently()) {
	        return this.consumer.connection.reopen();
	      }
	    }
	  };

	  ConnectionMonitor.prototype.connectionIsStale = function() {
	    var ref;
	    return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.constructor.staleThreshold;
	  };

	  ConnectionMonitor.prototype.disconnectedRecently = function() {
	    return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
	  };

	  ConnectionMonitor.prototype.visibilityDidChange = function() {
	    if (this.appComponent.visibilityState === 'visible') {
	      return setTimeout((function(_this) {
	        return function() {
	          if (_this.connectionIsStale() || !_this.consumer.connection.isOpen()) {
	            return _this.consumer.connection.reopen();
	          }
	        };
	      })(this), 200);
	    }
	  };

	  ConnectionMonitor.prototype.toJSON = function() {
	    var connectionIsStale, interval;
	    interval = this.getInterval();
	    connectionIsStale = this.connectionIsStale();
	    return {
	      startedAt: this.startedAt,
	      stoppedAt: this.stoppedAt,
	      pingedAt: this.pingedAt,
	      reconnectAttempts: this.reconnectAttempts,
	      connectionIsStale: connectionIsStale,
	      interval: interval
	    };
	  };

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

	})();

	module.exports = ConnectionMonitor;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var INTERNAL, Subscription, Subscriptions,
	  slice = [].slice;

	INTERNAL = __webpack_require__(4);

	Subscription = __webpack_require__(7);

	Subscriptions = (function() {
	  function Subscriptions(consumer) {
	    this.consumer = consumer;
	    this.subscriptions = [];
	    this.history = [];
	  }

	  Subscriptions.prototype.create = function(channelName, actions) {
	    var channel, params;
	    channel = channelName;
	    params = typeof channel === 'object' ? channel : {
	      channel: channel
	    };
	    return new Subscription(this, params, actions);
	  };

	  Subscriptions.prototype.add = function(subscription) {
	    this.subscriptions.push(subscription);
	    this.notify(subscription, 'initialized');
	    return this.sendCommand(subscription, 'subscribe');
	  };

	  Subscriptions.prototype.remove = function(subscription) {
	    this.forget(subscription);
	    if (!this.findAll(subscription.identifier).length) {
	      return this.sendCommand(subscription, 'unsubscribe');
	    }
	  };

	  Subscriptions.prototype.reject = function(identifier) {
	    var i, len, ref, results, subscription;
	    ref = this.findAll(identifier);
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      subscription = ref[i];
	      this.forget(subscription);
	      results.push(this.notify(subscription, 'rejected'));
	    }
	    return results;
	  };

	  Subscriptions.prototype.forget = function(subscription) {
	    var s;
	    return this.subscriptions = (function() {
	      var i, len, ref, results;
	      ref = this.subscriptions;
	      results = [];
	      for (i = 0, len = ref.length; i < len; i++) {
	        s = ref[i];
	        if (s !== subscription) {
	          results.push(s);
	        }
	      }
	      return results;
	    }).call(this);
	  };

	  Subscriptions.prototype.findAll = function(identifier) {
	    var i, len, ref, results, s;
	    ref = this.subscriptions;
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      s = ref[i];
	      if (s.identifier === identifier) {
	        results.push(s);
	      }
	    }
	    return results;
	  };

	  Subscriptions.prototype.reload = function() {
	    var i, len, ref, results, subscription;
	    ref = this.subscriptions;
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      subscription = ref[i];
	      results.push(this.sendCommand(subscription, 'subscribe'));
	    }
	    return results;
	  };

	  Subscriptions.prototype.notifyAll = function() {
	    var args, callbackName, i, len, ref, results, subscription;
	    callbackName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
	    ref = this.subscriptions;
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      subscription = ref[i];
	      results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
	    }
	    return results;
	  };

	  Subscriptions.prototype.notify = function() {
	    var args, callbackName, i, identifier, len, results, subscription, subscriptions;
	    subscription = arguments[0], callbackName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
	    if (typeof subscription === 'string') {
	      subscriptions = this.findAll(subscription);
	    } else {
	      subscriptions = [subscription];
	    }
	    results = [];
	    for (i = 0, len = subscriptions.length; i < len; i++) {
	      subscription = subscriptions[i];
	      if (typeof subscription[callbackName] === "function") {
	        subscription[callbackName].apply(subscription, args);
	      }
	      if (callbackName === 'initialized' || callbackName === 'connected' || callbackName === 'disconnected' || callbackName === 'rejected') {
	        identifier = subscription.identifier;
	        results.push(this.record({
	          notification: {
	            identifier: identifier,
	            callbackName: callbackName,
	            args: args
	          }
	        }));
	      } else {
	        results.push(void 0);
	      }
	    }
	    return results;
	  };

	  Subscriptions.prototype.sendCommand = function(subscription, command) {
	    var identifier;
	    identifier = subscription.identifier;
	    if (identifier === INTERNAL.identifiers.ping) {
	      return this.consumer.connection.isOpen();
	    } else {
	      return this.consumer.send({
	        command: command,
	        identifier: identifier
	      });
	    }
	  };

	  Subscriptions.prototype.record = function(data) {
	    data.time = new Date();
	    this.history = this.history.slice(-19);
	    return this.history.push(data);
	  };

	  Subscriptions.prototype.toJSON = function() {
	    var subscription;
	    return {
	      history: this.history,
	      identifiers: (function() {
	        var i, len, ref, results;
	        ref = this.subscriptions;
	        results = [];
	        for (i = 0, len = ref.length; i < len; i++) {
	          subscription = ref[i];
	          results.push(subscription.identifier);
	        }
	        return results;
	      }).call(this)
	    };
	  };

	  return Subscriptions;

	})();

	module.exports = Subscriptions;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter, Subscription,
	  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	  hasProp = {}.hasOwnProperty,
	  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	EventEmitter = __webpack_require__(8);

	Subscription = (function(superClass) {
	  extend(Subscription, superClass);

	  function Subscription(subscriptions, params, actions) {
	    this.subscriptions = subscriptions;
	    if (params == null) {
	      params = {};
	    }
	    this.actions = actions != null ? actions : [];
	    this.identifier = JSON.stringify(params);
	    this.subscriptions.add(this);
	    this.consumer = this.subscriptions.consumer;
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
	    return this.subscriptions.remove(this);
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
	    var ref;
	    if (ref = data.action, indexOf.call(this.actions, ref) >= 0) {
	      return this.emit(data.action, data);
	    } else {
	      return this.emit('received', data);
	    }
	  };

	  return Subscription;

	})(EventEmitter);

	module.exports = Subscription;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	// We store our EE objects in a plain object whose properties are event names.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// `~` to make sure that the built-in object properties are not overridden or
	// used as an attack vector.
	// We also assume that `Object.create(null)` is available when the event name
	// is an ES6 Symbol.
	//
	var prefix = typeof Object.create !== 'function' ? '~' : false;

	/**
	 * Representation of a single EventEmitter function.
	 *
	 * @param {Function} fn Event handler to be called.
	 * @param {Mixed} context Context for function execution.
	 * @param {Boolean} once Only emit once
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Minimal EventEmitter interface that is molded against the Node.js
	 * EventEmitter interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() { /* Nothing to set */ }

	/**
	 * Holds the assigned EventEmitters by name.
	 *
	 * @type {Object}
	 * @private
	 */
	EventEmitter.prototype._events = undefined;

	/**
	 * Return a list of assigned event listeners.
	 *
	 * @param {String} event The events that should be listed.
	 * @param {Boolean} exists We only need to know if there are listeners.
	 * @returns {Array|Boolean}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event, exists) {
	  var evt = prefix ? prefix + event : event
	    , available = this._events && this._events[evt];

	  if (exists) return !!available;
	  if (!available) return [];
	  if (available.fn) return [available.fn];

	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
	    ee[i] = available[i].fn;
	  }

	  return ee;
	};

	/**
	 * Emit an event to all registered event listeners.
	 *
	 * @param {String} event The name of the event.
	 * @returns {Boolean} Indication if we've emitted an event.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events || !this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if ('function' === typeof listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Register a new EventListener for the given event.
	 *
	 * @param {String} event Name of the event.
	 * @param {Functon} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events) this._events = prefix ? {} : Object.create(null);
	  if (!this._events[evt]) this._events[evt] = listener;
	  else {
	    if (!this._events[evt].fn) this._events[evt].push(listener);
	    else this._events[evt] = [
	      this._events[evt], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Add an EventListener that's only called once.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events) this._events = prefix ? {} : Object.create(null);
	  if (!this._events[evt]) this._events[evt] = listener;
	  else {
	    if (!this._events[evt].fn) this._events[evt].push(listener);
	    else this._events[evt] = [
	      this._events[evt], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Remove event listeners.
	 *
	 * @param {String} event The event we want to remove.
	 * @param {Function} fn The listener that we need to find.
	 * @param {Mixed} context Only remove listeners matching this context.
	 * @param {Boolean} once Only remove once listeners.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events || !this._events[evt]) return this;

	  var listeners = this._events[evt]
	    , events = [];

	  if (fn) {
	    if (listeners.fn) {
	      if (
	           listeners.fn !== fn
	        || (once && !listeners.once)
	        || (context && listeners.context !== context)
	      ) {
	        events.push(listeners);
	      }
	    } else {
	      for (var i = 0, length = listeners.length; i < length; i++) {
	        if (
	             listeners[i].fn !== fn
	          || (once && !listeners[i].once)
	          || (context && listeners[i].context !== context)
	        ) {
	          events.push(listeners[i]);
	        }
	      }
	    }
	  }

	  //
	  // Reset the array, or remove it completely if we have no more listeners.
	  //
	  if (events.length) {
	    this._events[evt] = events.length === 1 ? events[0] : events;
	  } else {
	    delete this._events[evt];
	  }

	  return this;
	};

	/**
	 * Remove all listeners or only the listeners for the specified event.
	 *
	 * @param {String} event The event want to remove all listeners for.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  if (!this._events) return this;

	  if (event) delete this._events[prefix ? prefix + event : event];
	  else this._events = prefix ? {} : Object.create(null);

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Expose the module.
	//
	if (true) {
	  module.exports = EventEmitter;
	}


/***/ },
/* 9 */
/***/ function(module, exports) {

	var Cable;

	Cable = (function() {
	  function Cable(channels) {
	    this.channels = channels;
	  }

	  Cable.prototype.channel = function(name) {
	    return this.channels[name];
	  };

	  Cable.prototype.setChannel = function(name, channel) {
	    return this.channels[name] = channel;
	  };

	  return Cable;

	})();

	module.exports = Cable;


/***/ },
/* 10 */
/***/ function(module, exports) {

	var CableMixin;

	CableMixin = function(React) {
	  return {
	    componentWillMount: function() {
	      var namePart;
	      if (!(this.props.cable || (this.context && this.context.cable))) {
	        namePart = this.constructor.displayName ? ' of ' + this.constructor.displayName : '';
	        throw new Error("Could not find cable on this.props or this.context" + namePart);
	      }
	    },
	    childContextTypes: {
	      cable: React.PropTypes.object
	    },
	    contextTypes: {
	      cable: React.PropTypes.object
	    },
	    getChildContext: function() {
	      return {
	        cable: this.getCable()
	      };
	    },
	    getCable: function() {
	      return this.props.cable || this.context && this.context.cable;
	    }
	  };
	};

	CableMixin.componentWillMount = function() {
	  throw new Error('ActionCableReact.CableMixin is a function that takes React as a ' + 'parameter and returns the mixin, e.g.: mixins: [ActionCableReact.CableMixin(React)]');
	};

	module.exports = CableMixin;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var ChannelMixin, _capitalize;

	_capitalize = __webpack_require__(12);

	ChannelMixin = function() {
	  var channelNames;
	  channelNames = Array.prototype.slice.call(arguments);
	  return {
	    componentDidMount: function() {
	      var action, actionMethod, cable, channel, i, len, results;
	      cable = this.props.cable || this.context.cable;
	      this.mounted = true;
	      results = [];
	      for (i = 0, len = channelNames.length; i < len; i++) {
	        channel = channelNames[i];
	        if (cable.channel(channel)) {
	          if (this.handleConnected != null) {
	            cable.channel(channel).on('connected', this.handleConnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).on('disconnected', this.handleDisconnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).on('rejected', this.handleDisconnected);
	          }
	          if (this.handleReceived != null) {
	            cable.channel(channel).on('received', this.handleReceived);
	          }
	          results.push((function() {
	            var j, len1, ref, results1;
	            ref = cable.channel(channel).actions;
	            results1 = [];
	            for (j = 0, len1 = ref.length; j < len1; j++) {
	              action = ref[j];
	              actionMethod = "handle" + (_capitalize(action));
	              if (this[actionMethod] != null) {
	                results1.push(cable.channel(channel).on(action, this[actionMethod]));
	              } else {
	                results1.push(void 0);
	              }
	            }
	            return results1;
	          }).call(this));
	        } else {
	          results.push(void 0);
	        }
	      }
	      return results;
	    },
	    componentWillUnmount: function() {
	      var action, actionMethod, cable, channel, i, len, results;
	      cable = this.props.cable || this.context.cable;
	      this.mounted = false;
	      results = [];
	      for (i = 0, len = channelNames.length; i < len; i++) {
	        channel = channelNames[i];
	        if (cable.channel(channel)) {
	          if (this.handleConnected != null) {
	            cable.channel(channel).removeListener('connected', this.handleConnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).removeListener('disconnected', this.handleDisconnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).removeListener('rejected', this.handleDisconnected);
	          }
	          if (this.handleReceived != null) {
	            cable.channel(channel).removeListener('received', this.handleReceived);
	          }
	          results.push((function() {
	            var j, len1, ref, results1;
	            ref = cable.channel(channel).actions;
	            results1 = [];
	            for (j = 0, len1 = ref.length; j < len1; j++) {
	              action = ref[j];
	              actionMethod = "handle" + (_capitalize(action));
	              if (this[actionMethod] != null) {
	                results1.push(cable.channel(channel).removeListener(action, this[actionMethod]));
	              } else {
	                results1.push(void 0);
	              }
	            }
	            return results1;
	          }).call(this));
	        } else {
	          results.push(void 0);
	        }
	      }
	      return results;
	    },
	    perform: function(channel, action, data) {
	      var cable;
	      if (data == null) {
	        data = {};
	      }
	      cable = this.props.cable || this.context.cable;
	      return cable.channel(channel).perform(action, data);
	    }
	  };
	};

	ChannelMixin.componentWillMount = function() {
	  throw new Error('ActionCableReact.ChannelMixin is a function that takes one or more ' + 'store names as parameters and returns the mixin, e.g.: ' + 'mixins: [ActionCableReact.ChannelMixin("Channel1", "Channel2")]');
	};

	module.exports = ChannelMixin;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var baseToString = __webpack_require__(13);

	/**
	 * Capitalizes the first character of `string`.
	 *
	 * @static
	 * @memberOf _
	 * @category String
	 * @param {string} [string=''] The string to capitalize.
	 * @returns {string} Returns the capitalized string.
	 * @example
	 *
	 * _.capitalize('fred');
	 * // => 'Fred'
	 */
	function capitalize(string) {
	  string = baseToString(string);
	  return string && (string.charAt(0).toUpperCase() + string.slice(1));
	}

	module.exports = capitalize;


/***/ },
/* 13 */
/***/ function(module, exports) {

	/**
	 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */

	/**
	 * Converts `value` to a string if it's not one. An empty string is returned
	 * for `null` or `undefined` values.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  return value == null ? '' : (value + '');
	}

	module.exports = baseToString;


/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = '0.1.1'


/***/ }
/******/ ]);