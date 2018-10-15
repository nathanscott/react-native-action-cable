[![npm version](https://badge.fury.io/js/action-cable-react.svg)](https://badge.fury.io/js/action-cable-react)
[![Bower version](https://badge.fury.io/bo/action-cable-react.svg)](https://badge.fury.io/bo/action-cable-react)

# ActionCable + React Native

Use Rails 5 ActionCable channels with React Native for realtime magic.

This is a fork from https://github.com/schneidmaster/action-cable-react

## Overview

TODO

## Usage

The action-cable-react package exposes four modules: ActionCable, Cable. With npm or webpack-type setups, you can `require` or `import` them as usual.

First, you need to define your ActionCable channels in your application setup (like `app.js`). Create your consumer:

```javascript
var actionCable = ActionCable.createConsumer('ws://localhost:3000/cable');
```

Then, create a new Cable object with your channels:

```javascript
var cable = new Cable({
  ChatChannel: actionCable.subscriptions.create({channel: 'ChatChannel', room: 'example_room'}, ['newMessage'])
});
```

action-cable-react breaks slightly with the documented Rails method for creating a new channel here. It accepts either a channel name or a params object as the first argument, but as the second argument, it accepts an array of message types rather than an object of message handler definitions. These message types are automatically mapped to corresponding methods on React components -- for example, as we will see in a moment, a React component with the ChatChannel mixed in will automatically have the `handleNewMessage` method triggered when a new message of type `newMessage` is received.


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
