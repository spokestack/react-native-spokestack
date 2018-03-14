import {
    NativeEventEmitter,
    NativeModules
} from 'react-native'

const { Spokestack } = NativeModules
const spokestackEmitter = new NativeEventEmitter(Spokestack)

class RNSpokestack {
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

  async start (pipelineInitialization) {
    var result = await Spokestack.start()
    if (result) {
      console.log('spokestack start error:' + JSON.stringify(result))
      return result
    }
  }

  async stop () {
    return Spokestack.stop()
  }

  // Events

  _onSpeechEvent (e) {
    switch (e.event.toLowerCase()) {
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
        if (this.onSpeechRecognized) {
          this.onSpeechRecognized(e)
        }
        break
      default:
        break
    }
  }
}

module.exports = new RNSpokestack()
