import {
    NativeEventEmitter,
    NativeModules
} from 'react-native'

const { RNSpokestack } = NativeModules
const spokestackEmitter = new NativeEventEmitter(RNSpokestack)

export const TraceLevel = Object.freeze({
  DEBUG: 10,
  PERF: 20,
  INFO: 30,
  NONE: 100
})

export const TTSFormat = Object.freeze({
  TEXT: 0,
  SSML: 1,
  SPEECHMARKDOWN: 2
})

// Warning: Order is fixed for interop with Spokestack-iOS. New profiles should be appended to end and coordinated with Spokestack-iOS releases.
export const PipelineProfile = Object.freeze({
  TFLITE_WAKEWORD_NATIVE_ASR: 0,
  VAD_NATIVE_ASR: 1,
  PTT_NATIVE_ASR: 2,
  TFLITE_WAKEWORD_SPOKESTACK_ASR: 3,
  VAD_SPOKESTACK_ASR: 4,
  PTT_SPOKESTACK_ASR: 5
})

class Spokestack {
  TraceLevel = TraceLevel
  TTSFormat = TTSFormat
  PipelineProfile = PipelineProfile

  // Class methods

  constructor () {
    this._loaded = false
    this._listeners = null
    this._events = {
      'onSpeechEvent': this._onSpeechEvent.bind(this),
      'onTTSEvent': this._onTTSEvent.bind(this),
      'onNLUEvent': this._onNLUEvent.bind(this),
      'onErrorEvent': this._onErrorEvent.bind(this),
      'onTraceEvent': this._onTraceEvent.bind(this)
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

  _onErrorEvent (e) {
    if (this.onError) {
      this.onError(e)
    }
  }

  _onTraceEvent (e) {
    if (this.onTrace) {
      this.onTrace(e)
    }
  }

  _onNLUEvent (e) {
    console.log('js onNLUEvent ' + e.event)
    if (this.onClassification) {
      this.onClassification(e)
    }
  }

  _onTTSEvent (e) {
    if (this.onSuccess) {
      this.onSuccess(e)
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
