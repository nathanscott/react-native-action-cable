[![npm version](https://badge.fury.io/js/action-cable-react.svg)](https://badge.fury.io/js/action-cable-react)
[![Bower version](https://badge.fury.io/bo/action-cable-react.svg)](https://badge.fury.io/bo/action-cable-react)

# ActionCable + React Native

Use Rails 5+ ActionCable channels with React Native for realtime magic.

This is a fork from https://github.com/schneidmaster/action-cable-react

## Overview

The `react-native-action-cable` package exposes two modules: ActionCable, Cable.

- **`ActionCable`**: holds info and logic of connection and automatically tries to reconnect when connection is lost.
- **`Cable`**: holds references to channels(subscriptions) created by action cable.

## Install

```yarn add @kesha-antonov/react-native-action-cable```

## Usage

Import:

```javascript
import {
  ActionCable,
  Cable,
} from '@kesha-antonov/react-native-action-cable'
```

Define once ActionCable and Cable in your application setup in your store (like `Redux` or `MobX`).

Create your consumer:

```javascript
const actionCable = ActionCable.createConsumer('ws://localhost:3000/cable')
```

Right after that create Cable instance. It'll hold info of our channels.

```javascript
const cable = new Cable({})
```

Then, you can subscribe to channel:

```javascript
const channel = cable.setChannel(
  `chat_${chatId}_${userId}`, // channel name to which we will pass data from Rails app with `stream_from`
  actionCable.subscriptions.create({
    channel: 'ChatChannel', // from Rails app app/channels/chat_channel.rb
    chatId,
    otherParams...
  })
)

channel
  .on( 'received', this.handleReceived )
  .on( 'connected', this.handleConnected )
  .on( 'rejected', this.handleDisconnected )
  .on( 'disconnected', this.handleDisconnected )
```

...later we can remove event listeners and unsubscribe from channel:

```javascript
const channelName = `chat_${chatId}_${userId}`
const channel = cable.channel(channelName)
if (channel) {
  channel
    .removeListener( 'received', this.handleReceived )
    .removeListener( 'connected', this.handleConnected )
    .removeListener( 'rejected', this.handleDisconnected )
    .removeListener( 'disconnected', this.handleDisconnected )
  channel.unsubscribe()
  delete( cable.channels[channelName] )
}

```

You can combine React's lifecycle hooks `componentDidMount` and `componentWillUnmount` to subscribe and unsubscribe from channels. Or implement custom logic in your `store`.

Here's example how you can handle events:

```javascript
handleReceived = (data) => {
  switch(data.type) {
    'new_incoming_message': {
       this.onNewMessage(data.message)
    }
    ...
  }
}

handleConnected = () => {
  if (this.state.isWebsocketConnected) return

  this.setState({ isWebsocketConnected: true })
}

handleDisconnected = () => {
  if (!this.state.isWebsocketConnected) return

  this.setState({ isWebsocketConnected: false })
}
```

Send message to Rails app:

```javascript
cable.channel(channelName).perform('send_message', { text: 'Hey' })

cable.channel('NotificationsChannel').perform('appear')
```

## Methods

`ActionCable` top level methods:

- **`.createConsumer(websocketUrl)`**  - create actionCable consumer and start connecting
- **`.startDebugging()`**  - start logging
- **`.stopDebugging()`**  - stop logging

`ActionCable` instance methods:

- **`.open()`**  - try connect
- **`.connection.isOpen()`**  - check if `connected`
- **`.connection.isActive()`**  - check if `connected` or `connecting`
- **`.subscriptions.create({ channel, otherParams... })`**  - create subscription to Rails app
- **`.disconnect()`**  - disconnects from Rails app


`Cable` instance methods:

- **`.setChannel(name, actionCable.subscriptions.create())`**  - set channel to get it later
- **`.channel(name)`**  - get channel by name

`channel` methods:

- **`.perform(action, data)`**  - send message to channel. action - `string`, data - `json`
- **`.on(eventName, eventListener)`**  - subscribe to events. eventName can be `received`, `connected`, `rejected`, `disconnected`
- **`.removeListener(eventName, eventListener)`**  - unsubscribe from event
- **`.unsubscribe()`**  - unsubscribe from channel


## Contributing

1. Fork it ( https://github.com/kesha-antonov/react-native-action-cable/fork )
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create a new Pull Request

## Credits

Obviously, this project is heavily indebted to the entire Rails team, and most of the code in `lib/action_cable` is taken directly from Rails 5. This project also referenced [fluxxor](https://github.com/BinaryMuse/fluxxor) for implementation details and props binding.

## License

MIT
