import {
  NLUConfig,
  PipelineProfile,
  SpokestackConfig,
  SpokestackEvent,
  SpokestackNLUResult,
  TTSFormat,
  TraceLevel,
  WakewordConfig
} from './types'
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform
} from 'react-native'

import resolveModelUrl from './resolveModelUrl'

const { Spokestack } = NativeModules

// Event emitter
const emitter = new NativeEventEmitter(Spokestack)

interface SpokestackType {
  PipelineProfile: typeof PipelineProfile
  TraceLevel: typeof TraceLevel
  TTSFormat: typeof TTSFormat
  /**
   * Initialize the speech pipeline; required for all other methods.
   *
   * The first 2 args are your Spokestack credentials
   * available for free from https://spokestack.io.
   * Avoid hardcoding these in your app.
   * There are several ways to include
   * environment variables in your code.
   *
   * Using process.env:
   * https://babeljs.io/docs/en/babel-plugin-transform-inline-environment-variables/
   *
   * Using a local .env file ignored by git:
   * https://github.com/goatandsheep/react-native-dotenv
   * https://github.com/luggit/react-native-config
   *
   * See SpokestackConfig for all available options.
   *
   * ```js
   * import Spokestack from 'react-native-spokestack'
   *
   * // ...
   *
   * await Spokestack.initialize(process.env.CLIENT_ID, process.env.CLIENT_SECRET, {
   *   pipeline: {
   *     profile: Spokestack.PipelineProfile.PTT_NATIVE_ASR
   *   }
   * })
   * ```
   */
  initialize(
    clientId: string,
    clientSecret: string,
    config?: SpokestackConfig
  ): Promise<void>
  /**
   * Start the speech pipeline.
   * The speech pipeline starts in the `deactivate` state.
   *
   * ```js
   * import Spokestack from 'react-native-spokestack`
   *
   * // ...
   *
   * Spokestack.initialize(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
   *   .then(Spokestack.start)
   * ```
   */
  start(): Promise<void>
  /**
   * Stop the speech pipeline.
   * This effectively stops ASR, VAD, and wakeword.
   *
   * ```js
   * import Spokestack from 'react-native-spokestack`
   *
   * // ...
   *
   * await Spokestack.stop()
   * ```
   */
  stop(): Promise<void>
  /**
   * Manually activate the speech pipeline.
   * This is necessary when using a PTT profile.
   * VAD profiles can also activate ASR without the need
   * to call this method.
   *
   * ```js
   * import Spokestack from 'react-native-spokestack`
   *
   * // ...
   *
   * <Button title="Listen" onClick={() => Spokestack.activate()} />
   * ```
   */
  activate(): Promise<void>
  /**
   * Deactivate the speech pipeline.
   * If the profile includes wakeword, the pipeline will go back
   * to listening for the wakeword.
   * If VAD is active, the pipeline can reactivate without calling activate().
   *
   * ```js
   * import Spokestack from 'react-native-spokestack`
   *
   * // ...
   *
   * <Button title="Stop listening" onClick={() => Spokestack.deactivate()} />
   * ```
   */
  deactivate(): Promise<void>
  /**
   * Synthesize some text into speech
   * Returns `Promise<string>` with the string
   * being the URL for a playable mpeg.
   *
   * There is currently only one free voice available ("demo-male").
   *
   * ```js
   * const url = await Spokestack.synthesize('Hello world')
   * play(url)
   * ```
   */
  synthesize(input: string, format?: TTSFormat, voice?: string): Promise<string>
  /**
   * Synthesize some text into speech
   * and then immediately play the audio through
   * the default audio system.
   * Audio session handling can get very complex and we recommend
   * using a RN library focused on audio for anything more than
   * very simple playback.
   *
   * There is currently only one free voice available ("demo-male").
   *
   * ```js
   * await Spokestack.speak('Hello world')
   * ```
   */
  speak(input: string, format?: TTSFormat, voice?: string): Promise<void>
  /**
   * Classify the utterance using the
   * intent/slot Natural Language Understanding model
   * passed to Spokestack.initialize().
   * See https://www.spokestack.io/docs/concepts/nlu for more info.
   *
   * ```js
   * const result = await Spokestack.classify('hello')
   *
   * // Here's what the result might look like,
   * // depending on the NLU model
   * console.log(result.intent) // launch
   * ```
   */
  classify(utterance: string): Promise<SpokestackNLUResult>
  /**
   * Returns whether Spokestack has been initialized
   *
   * ```js
   * console.log(`isInitialized: ${await Spokestack.isInitialized()}`)
   * ```
   */
  isInitialized(): Promise<boolean>
  /**
   * Returns whether the speech pipeline has been started
   *
   * ```js
   * console.log(`isStarted: ${await Spokestack.isStarted()}`)
   * ```
   */
  isStarted(): Promise<boolean>
  /**
   * Returns whether the speech pipeline is currently activated
   *
   * ```js
   * console.log(`isActivated: ${await Spokestack.isActivated()}`)
   * ```
   */
  isActivated(): Promise<boolean>
  /**
   * Bind to any event emitted by the native libraries
   * The events are: "recognize", "partial_recognize", "error", "activate", "deactivate", and "timeout".
   * See the bottom of the README.md for descriptions of the events.
   *
   * ```js
   * useEffect(() => {
   *   const listener = Spokestack.addEventListener('recognize', onRecognize)
   *   // Unsubsribe by calling remove when components are unmounted
   *   return () => {
   *     listener.remove()
   *   }
   * }, [])
   * ```
   */
  addEventListener: typeof emitter.addListener
  /**
   * Remove an event listener
   *
   * ```js
   * Spokestack.removeEventListener('recognize', onRecognize)
   * ```
   */
  removeEventListener: typeof emitter.removeListener
  /**
   * Remove any existing listeners
   *
   * ```js
   * componentWillUnmount() {
   *   Spokestack.removeAllListeners()
   * }
   * ```
   */
  removeAllListeners: () => void
}

// This is necessary to allow usage where arguments may
// be passed accidentally.
// For example,
// Spokestack.initialize(id, secret, config).then(Spokestack.start)
// The above call to start would normally throw an error.
;['stop', 'deactivate'].forEach((method) => {
  const original = Spokestack[method]
  Spokestack[method] = () => original()
})

// start (if using wakeword) and activate also require microphone permissions
;['start', 'activate'].forEach((method) => {
  const original = Spokestack[method]
  Spokestack[method] = async () => {
    // Android requires you to ask for the permission manually
    // iOS will bring up a dialog automatically
    if (
      Platform.OS === 'android' &&
      !(await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      ))
    ) {
      return Promise.reject(
        `Microphone permission is required to use Spokestack.
        Use PermissionsAndroid from React Native to request microphone
        permission before calling Spokestack.start() or Spokestack.activate().`
      )
    }
    return original()
  }
})

// Make all but one argument optional in JS-land
;['synthesize', 'speak'].forEach((method) => {
  const original = Spokestack[method]
  Spokestack[method] = (
    input: string,
    format: TTSFormat = TTSFormat.TEXT,
    voice: string = 'demo-male'
  ) => original(input, format, voice)
})

// Ensure method is called with proper number of args despite what's passed
const originalInit = Spokestack.initialize
Spokestack.initialize = (
  id: string,
  secret: string,
  config: SpokestackConfig = {}
) => {
  // Resolve source objects to URLs for local downloads
  const wakewordConfig = (config.wakeword || {}) as WakewordConfig
  if (wakewordConfig.filter && typeof wakewordConfig.filter !== 'string') {
    wakewordConfig.filter = resolveModelUrl(wakewordConfig.filter)
  }
  if (wakewordConfig.detect && typeof wakewordConfig.detect !== 'string') {
    wakewordConfig.detect = resolveModelUrl(wakewordConfig.detect)
  }
  if (wakewordConfig.encode && typeof wakewordConfig.encode !== 'string') {
    wakewordConfig.encode = resolveModelUrl(wakewordConfig.encode)
  }
  // Default the profile to one supporting wakeword
  // if wakeword config files are specified
  // and no profile was set.
  if (
    wakewordConfig.filter &&
    wakewordConfig.detect &&
    wakewordConfig.encode &&
    !config.pipeline?.profile
  ) {
    config.pipeline = config.pipeline || {}
    config.pipeline.profile = PipelineProfile.TFLITE_WAKEWORD_NATIVE_ASR
  }
  const nluConfig = (config.nlu || {}) as NLUConfig
  if (nluConfig.model && typeof nluConfig.model !== 'string') {
    nluConfig.model = resolveModelUrl(nluConfig.model)
  }
  if (nluConfig.metadata && typeof nluConfig.metadata !== 'string') {
    nluConfig.metadata = resolveModelUrl(nluConfig.metadata)
  }
  if (nluConfig.vocab && typeof nluConfig.vocab !== 'string') {
    nluConfig.vocab = resolveModelUrl(nluConfig.vocab)
  }
  return originalInit(id, secret, config)
}

Object.assign(Spokestack, {
  // Add enums as values
  PipelineProfile,
  TraceLevel,
  TTSFormat,

  // Event handling
  addEventListener: (
    type: string,
    listener: (event: SpokestackEvent) => void
  ) => emitter.addListener(type, listener),
  removeEventListener: (
    type: string,
    listener: (event: SpokestackEvent) => void
  ) => emitter.removeListener(type, listener),
  removeAllListeners: () => {
    ;[
      'recognize',
      'partial_recognize',
      'activate',
      'deactivate',
      'timeout',
      'play',
      'error'
    ].forEach((event) => emitter.removeAllListeners(event))
  }
})

// Export types to be used as separate exports
export * from './types'
// Allow importing these methods separately
export const {
  initialize,
  start,
  stop,
  activate,
  deactivate,
  synthesize,
  speak,
  classify
} = Spokestack as SpokestackType
export default Spokestack as SpokestackType
