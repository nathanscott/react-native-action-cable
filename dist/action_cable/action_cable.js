var ActionCable,Consumer;Consumer=require("./consumer").default,ActionCable={INTERNAL:require("./internal"),WebSocket:window.WebSocket,logger:window.console,createConsumer:function(e,n){return new Consumer(e,n,this.log,this.WebSocket)},startDebugging:function(){return this.debugging=!0},stopDebugging:function(){return this.debugging=null},log:function(...e){if(ActionCable.debugging)return e.push(Date.now()),ActionCable.logger.log("[ActionCable]",...e)}};export default ActionCable;