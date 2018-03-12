import {
    NativeEventEmitter,
    NativeModules
} from 'react-native'

const { RNSpokestack } = NativeModules
const spokestackEmitter = new NativeEventEmitter(RNSpokestack)

class Spokestack {
  // Class methods

  constructor () {
    this._loaded = false
    this._listeners = null
    this._events = {
      'onSpeechEvent': this._onSpeechEvent.bind(this)
    }
  }

  destroy () {
    if (this._listeners) {
      this._listeners.map((listener, index) => listener.remove())
      this._listeners = null
    }
  }

  initialize (pipelineComponents) {
    if (!this._loaded && !this._listeners) {
      this._listeners = Object.keys(this._events)
        .map((key, index) => spokestackEmitter.addListener(key, this._events[key]))
    }

    // I also don’t want to have to provide a fixed list of aliases inside the framework. so we may just have to set up a mapping section inside the config that maps logical names to ios/android component names

    const pipelineInit = {
      input: 'com.pylon.spokestack.android.MicrophoneInput',
      components: pipelineComponents,
      configuration: {
        'sample-rate': 16000
      }
    }

    return pipelineInit
  }

  start (pipelineInitialization) {
    RNSpokestack.start()
  }

  stop () {
    RNSpokestack.stop()
  }

  transcript () {
    RNSpokestack.transcript()
  }

  isActive () {
    RNSpokestack.isActive()
  }

  // Events

  _onSpeechEvent (e) {
    switch (e) {
      case 'activate':
        if (this.onSpeechStart) {
          this.onSpeechStart(e)
        }
        break
      case 'deactivate':
      if (this.onSpeechEnd) {
          this.onSpeechEnd(e)
        }
        break
      case 'recognize':
        if (this.onSpeechResults) {
          this.onSpeechResults(e)
        }
        break
      default:
        break
    }
  }
}

module.exports = new Spokestack()
