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
      // 'onSpeechEvent': this._onSpeechEvent.bind(this)
      // 'onSpeechError': this.onSpeechError.bind(this),
      // 'onSpeechRecognized': this.onSpeechRecognized.bind(this),
      // 'onSpeechStarted': this.onSpeechStarted.bind(this),
      // 'onSpeechEnded': this.onSpeechEnded.bind(this)
    }
  }

  destroy () {
    if (this._listeners) {
      this._listeners.map((listener, index) => listener.remove())
      this._listeners = null
    }
  }

  initialize (pipelineConfig) {
    if (!this._loaded && !this._listeners) {
      // this._listeners = Object.keys(this._events)
      // .map((key, index) => spokestackEmitter.addListener(key, this._events[key]))
      this._listeners = [
        spokestackEmitter.addListener('onSpeechError', this.onSpeechError),
        spokestackEmitter.addListener('onSpeechStarted', this.onSpeechStarted),
        spokestackEmitter.addListener('onSpeechRecognized', this.onSpeechRecognized),
        spokestackEmitter.addListener('onSpeechEnded', this.onSpeechEnded)
      ]
    }

    // I also don’t want to have to provide a fixed list of aliases inside the framework. so we may just have to set up a mapping section inside the config that maps logical names to ios/android component names

    RNSpokestack.initialize(pipelineConfig)
  }

  start () {
    RNSpokestack.start()
  }

  stop () {
    RNSpokestack.stop()
  }

  // Events

  _onSpeechEvent (e) {
    console.log('RNSpokestack _onSpeechEvent ' + JSON.stringify(e))
    switch (e.event.toLowerCase()) {
      case 'activate':
        if (this.onSpeechStarted) {
          this.onSpeechStarted(e)
        }
        break
      case 'deactivate':
        if (this.onSpeechEnded) {
          this.onSpeechEnded(e)
        }
        break
      case 'recognize':
        if (this.onSpeechRecognized) {
          this.onSpeechRecognized(e)
        }
        break
      case 'error':
        if (this.onSpeechError) {
          this.onSpeechError(e)
        }
        break
      default:
        break
    }
  }
}

module.exports = new Spokestack()
