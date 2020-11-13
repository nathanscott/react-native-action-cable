var Connection,ConnectionMonitor,message_types,protocols,supportedProtocols,unsupportedProtocol,splice=[].splice,indexOf=[].indexOf;({message_types:message_types,protocols:protocols}=require("./internal").default),ConnectionMonitor=require("./connection_monitor").default,[...supportedProtocols]=protocols,[unsupportedProtocol]=splice.call(supportedProtocols,-1),Connection=function(){class t{constructor(t,e,s){this.send=this.send.bind(this),this.open=this.open.bind(this),this.close=this.close.bind(this),this.reopen=this.reopen.bind(this),this.getProtocol=this.getProtocol.bind(this),this.isOpen=this.isOpen.bind(this),this.isActive=this.isActive.bind(this),this.isProtocolSupported=this.isProtocolSupported.bind(this),this.isState=this.isState.bind(this),this.getState=this.getState.bind(this),this.installEventHandlers=this.installEventHandlers.bind(this),this.uninstallEventHandlers=this.uninstallEventHandlers.bind(this),this.consumer=t,this.log=e,this.WebSocket=s,({subscriptions:this.subscriptions}=this.consumer),this.monitor=new ConnectionMonitor(this,this.log),this.disconnected=!0}send(t){return!!this.isOpen()&&(this.webSocket.send(JSON.stringify(t)),!0)}open(){return this.isActive()?(this.log("Attempted to open WebSocket, but existing socket is "+this.getState()),!1):(this.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${protocols}`),null!=this.webSocket&&this.uninstallEventHandlers(),null!=this.consumer.jwt?(this.webSocket=new this.WebSocket(this.consumer.url,protocols.concat(this.consumer.jwt)),this.webSocket.protocol="actioncable-v1-json"):this.webSocket=new this.WebSocket(this.consumer.url,protocols),this.installEventHandlers(),this.monitor.start(),!0)}close({allowReconnect:t}={allowReconnect:!0}){var e;if(t||this.monitor.stop(),this.isActive())return null!=(e=this.webSocket)?e.close():void 0}reopen(){var t;if(this.log("Reopening WebSocket, current state is "+this.getState()),!this.isActive())return this.open();try{return this.close()}catch(e){return t=e,this.log("Failed to reopen WebSocket",t)}finally{this.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`),setTimeout(this.open,this.constructor.reopenDelay)}}getProtocol(){var t;return null!=(t=this.webSocket)?t.protocol:void 0}isOpen(){return this.isState("open")}isActive(){return this.isState("open","connecting")}isProtocolSupported(){var t;return t=this.getProtocol(),indexOf.call(supportedProtocols,t)>=0}isState(...t){var e;return e=this.getState(),indexOf.call(t,e)>=0}getState(){var t,e;for(e in WebSocket)if(WebSocket[e]===(null!=(t=this.webSocket)?t.readyState:void 0))return e.toLowerCase();return null}installEventHandlers(){var t,e;for(t in this.events)e=this.events[t].bind(this),this.webSocket["on"+t]=e}uninstallEventHandlers(){var t;for(t in this.events)this.webSocket["on"+t]=()=>{}}}return t.reopenDelay=500,t.prototype.events={message:function(t){var e,s,o;if(this.isProtocolSupported())switch(({identifier:e,message:s,type:o}=JSON.parse(t.data)),null!=t.data.close&&t.data.close(),o){case message_types.welcome:return this.monitor.recordConnect(),this.subscriptions.reload();case message_types.ping:return this.monitor.recordPing();case message_types.confirmation:return this.subscriptions.notify(e,"connected");case message_types.rejection:return this.subscriptions.reject(e);default:return this.subscriptions.notify(e,"received",s)}else null!=t.data.close&&t.data.close()},open:function(){if(this.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`),this.disconnected=!1,!this.isProtocolSupported())return this.log("Protocol is unsupported. Stopping monitor and disconnecting."),this.close({allowReconnect:!1})},close:function(t){if(this.log("WebSocket onclose event"),!this.disconnected)return this.disconnected=!0,this.monitor.recordDisconnect(),this.subscriptions.notifyAll("disconnected",{willAttemptReconnect:this.monitor.isRunning()})},error:function(){return this.log("WebSocket onerror event")}},t}.call(this);export default Connection;