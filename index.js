import {
    NativeEventEmitter,
    NativeModules
} from 'react-native'

const { Spokestack } = NativeModules
const spokestackEmitter = new NativeEventEmitter(Spokestack)

const TraceLevel = Object.freeze({
  DEBUG: 10,
  PERF: 20,
  INFO: 30,
  NONE: 100
})

class RNSpokestack {
  get TraceLevel () {
    return TraceLevel
  }

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

  initialize (pipelineConfig) {
    if (!this._loaded && !this._listeners) {
      this._listeners = Object.keys(this._events)
        .map((key, index) => spokestackEmitter.addListener(key, this._events[key]))
    }

    // I also don’t want to have to provide a fixed list of aliases inside the framework. so we may just have to set up a mapping section inside the config that maps logical names to ios/android component names

    Spokestack.initialize(pipelineConfig)
  }

  start () {
    Spokestack.start()
  }

  stop () {
    Spokestack.stop()
  }

  activate () {
    Spokestack.activate()
  }

  deactivate () {
    Spokestack.deactivate()
  }

  // Events

  _onSpeechEvent (e) {
    switch (e.event.toLowerCase()) {
      case 'activate':
        if (this.onActivate) {
          this.onActivate(e)
        }
        break
      case 'deactivate':
        if (this.onDeactivate) {
          this.onDeactivate(e)
        }
        break
      case 'recognize':
        if (this.onRecognize) {
          this.onRecognize(e)
        }
        break
      case 'trace':
        if (this.onTrace) {
          this.onTrace(e)
        }
        break
      case 'error':
        if (this.onError) {
          this.onError(e)
        }
        break
      case 'start':
        if (this.onStart) {
          this.onStart(e)
        }
        break
      case 'stop':
        if (this.onStop) {
          this.onStop(e)
        }
        break
      default:
        break
    }
  }
}

module.exports = new RNSpokestack()
