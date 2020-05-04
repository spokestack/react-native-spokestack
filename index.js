import {
    NativeEventEmitter,
    NativeModules
} from 'react-native'

const { RNSpokestack } = NativeModules
const spokestackEmitter = new NativeEventEmitter(RNSpokestack)

const TraceLevel = Object.freeze({
  DEBUG: 10,
  PERF: 20,
  INFO: 30,
  NONE: 100
})

const TTSFormat = Object.freeze({
  TEXT: 0,
  SSML: 1,
  SPEECHMARKDOWN: 2
})

class Spokestack {
  get TraceLevel () {
    return TraceLevel
  }

  get TTSFormat () {
    return TTSFormat
  }

  // Class methods

  constructor () {
    this._loaded = false
    this._listeners = null
    this._events = {
      'onSpeechEvent': this._onSpeechEvent.bind(this),
      'onTTSEvent': this._onTTSEvent.bind(this),
      'onNLUEvent': this._onNLUEvent.bind(this)
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

    RNSpokestack.initialize(pipelineConfig)
  }

  start () {
    RNSpokestack.start()
  }

  stop () {
    RNSpokestack.stop()
  }

  activate () {
    RNSpokestack.activate()
  }

  deactivate () {
    RNSpokestack.deactivate()
  }

  synthesize (ttsInput) {
    RNSpokestack.synthesize(ttsInput)
  }

  classify (utterance, context) {
    RNSpokestack.classify(utterance, context)
  }

  // Events

  _onNLUEvent (e) {
    console.log('js onNLUEvent ' + e.event)
    switch (e.event.toLowerCase()) {
      case 'classification':
        if (this.onClassification) {
          this.onClassification(e)
        }
        break
      case 'error':
        if (this.onError) {
          this.onError(e)
        }
        break
      default:
        break
    }
  }

  _onTTSEvent (e) {
    switch (e.event.toLowerCase()) {
      case 'success':
        if (this.onSuccess) {
          this.onSuccess(e)
        }
        break
      case 'failure':
        if (this.onFailure) {
          this.onFailure(e)
        }
        break
      default:
        break
    }
  }

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
      case 'init':
        if (this.onInit) {
          this.onInit(e)
        }
        break
      case 'timeout':
        if (this.onTimeout) {
          this.onTimeout(e)
        }
        break
      default:
        break
    }
  }
}

module.exports = new Spokestack()
