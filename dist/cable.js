var Cable;

Cable = class Cable {
  constructor(channels) {
    this.channels = channels;
  }

  
  channel(name) {
    return this.channels[name];
  }

  setChannel(name, channel) {
    return this.channels[name] = channel;
  }

};

module.exports = Cable;
