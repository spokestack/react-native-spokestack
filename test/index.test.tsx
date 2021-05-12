import { NativeModules } from 'react-native'
const initialize = jest.fn()
const synthesize = jest.fn()
const speak = jest.fn()
NativeModules.Spokestack = {
  initialize,
  destroy: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  activate: jest.fn(),
  deactivate: jest.fn(),
  synthesize,
  speak,
  classify: jest.fn()
}
const {
  default: Spokestack,
  TTSFormat,
  TraceLevel,
  PipelineProfile
} = require('../src/index')

const testInput = 'Hello world'

describe('Index', () => {
  it('has all expected exports', () => {
    expect(Spokestack.initialize).toBeDefined()
    expect(Spokestack.destroy).toBeDefined()
    expect(Spokestack.start).toBeDefined()
    expect(Spokestack.stop).toBeDefined()
    expect(Spokestack.activate).toBeDefined()
    expect(Spokestack.deactivate).toBeDefined()
    expect(Spokestack.synthesize).toBeDefined()
    expect(Spokestack.speak).toBeDefined()
    expect(Spokestack.classify).toBeDefined()
    expect(Spokestack.addEventListener).toBeDefined()
    expect(Spokestack.removeEventListener).toBeDefined()
    expect(Spokestack.removeAllListeners).toBeDefined()
    expect(TTSFormat).toBeDefined()
    expect(TraceLevel).toBeDefined()
    expect(PipelineProfile).toBeDefined()
  })

  afterEach(() => {
    initialize.mockReset()
    synthesize.mockReset()
    speak.mockReset()
  })

  it('sets allows native to set a default pipeline profile', async () => {
    await Spokestack.initialize('id', 'secret')
    expect(initialize).toHaveBeenCalledWith('id', 'secret', {
      refreshModels: true,
      pipeline: {}
    })
  })

  it('sets a default profile if wakeword is specified', async () => {
    const config = {
      wakeword: {
        detect: 'faux_url',
        encode: 'faux_url',
        filter: 'faux_url'
      }
    }
    await Spokestack.initialize('id', 'secret', config)
    expect(initialize).toHaveBeenCalledWith('id', 'secret', {
      ...config,
      refreshModels: true,
      pipeline: {
        profile: PipelineProfile.TFLITE_WAKEWORD_NATIVE_ASR
      }
    })

    initialize.mockReset()
    const configIncomplete = {
      wakeword: {
        detect: 'faux_url',
        encode: 'faux_url'
      }
    }
    await Spokestack.initialize('id', 'secret', configIncomplete)
    expect(initialize).toHaveBeenCalledWith('id', 'secret', {
      ...configIncomplete,
      refreshModels: true
    })
  })

  it('sets a default profile if keyword is specified', async () => {
    const config = {
      keyword: {
        detect: 'faux_url',
        encode: 'faux_url',
        filter: 'faux_url'
      }
    }
    // Must pass either classes or metadata to set the profile
    await Spokestack.initialize('id', 'secret', config)
    expect(initialize).toHaveBeenCalledWith('id', 'secret', {
      ...config,
      refreshModels: true
    })

    initialize.mockReset()
    const configMeta = {
      keyword: {
        ...config.keyword,
        metadata: 'faux_url'
      }
    }
    await Spokestack.initialize('id', 'secret', configMeta)
    expect(initialize).toHaveBeenCalledWith('id', 'secret', {
      ...configMeta,
      refreshModels: true,
      pipeline: {
        profile: PipelineProfile.VAD_KEYWORD_ASR
      }
    })

    initialize.mockReset()
    const configClasses = {
      keyword: {
        ...config.keyword,
        classes: ['one', 'two']
      }
    }
    await Spokestack.initialize('id', 'secret', configClasses)
    expect(initialize).toHaveBeenCalledWith('id', 'secret', {
      keyword: {
        ...config.keyword,
        classes: 'one,two'
      },
      refreshModels: true,
      pipeline: {
        profile: PipelineProfile.VAD_KEYWORD_ASR
      }
    })
  })

  it('sets a default format of TEXT and default voice of demo-male for synthesize', async () => {
    await Spokestack.synthesize(testInput)
    expect(synthesize).toHaveBeenCalledWith(
      testInput,
      TTSFormat.TEXT,
      'demo-male'
    )
  })

  it('sets a default format of TEXT and default voice of demo-male for speak', async () => {
    await Spokestack.speak(testInput)
    expect(speak).toHaveBeenCalledWith(testInput, TTSFormat.TEXT, 'demo-male')
  })

  // The testing of functionality is handled in the example app
  // and in spokestack-ios and spokestack-android.
})
