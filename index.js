import {
    NativeEventEmitter,
    NativeModules
} from 'react-native'

const {
    RNSpokestack
} = NativeModules
const spokestackEmitter = new NativeEventEmitter(RNSpokestack)

// Configuration Enums

const PipelineComponents = {
  SAD: Symbol('com.pylon.spokestack.libfvad.VADTrigger'),
  ASR: Symbol('com.pylon.spokestack.?'),
  COMMANDS: Symbol('com.pylon.spokestack.?')
}

class Spokestack {
  // Class methods

  constructor () {
    this._loaded = false
    this._listeners = null
    this.events = {
      'onSpeechStart': this._onSpeechStart.bind(this),
      'onSpeechEnd': this._onSpeechEnd.bind(this),
      'onSpeechError': this._onSpeechError.bind(this),
      'onSpeechResults': this._onSpeechResults.bind(this)
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
    // RNSpokestack.start(pipelineInitialization)
  }

  stop () {}

  // Events

  _onSpeechStart (e) {
    if (this.onSpeechStart) {
      this.onSpeechStart(e)
    }
  }
  _onSpeechEnd (e) {
    if (this.onSpeechEnd) {
      this.onSpeechEnd(e)
    }
  }
  _onSpeechError (e) {
    if (this.onSpeechError) {
      this.onSpeechError(e)
    }
  }
  _onSpeechResults (e) {
    if (this.onSpeechResults) {
      this.onSpeechResults(e)
    }
  }
}

module.exports = new Spokestack()
