import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform
} from 'react-native'
import {
  KeywordConfig,
  KeywordWithClassesConfig,
  KeywordWithMetadataConfig,
  NLUConfig,
  PipelineProfile,
  SpokestackConfig,
  SpokestackEvent,
  SpokestackNLUResult,
  TTSFormat,
  TraceLevel,
  WakewordConfig
} from './types'

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
   * @example
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
   * Destroys the speech pipeline, removes all listeners, and frees up all resources.
   * This can be called before re-initializing the pipeline.
   * A good place to call this is in `componentWillUnmount`.
   *
   * @example
   * ```js
   * componentWillUnmount() {
   *   Spokestack.destroy()
   * }
   * ```
   */
  destroy(): Promise<void>
  /**
   * Start the speech pipeline.
   * The speech pipeline starts in the `deactivate` state.
   *
   * @example
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
   * @example
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
   * @example
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
   * @example
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
   * @example
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
   * @example
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
   * @example
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
   * @example
   * ```js
   * console.log(`isInitialized: ${await Spokestack.isInitialized()}`)
   * ```
   */
  isInitialized(): Promise<boolean>
  /**
   * Returns whether the speech pipeline has been started
   *
   * @example
   * ```js
   * console.log(`isStarted: ${await Spokestack.isStarted()}`)
   * ```
   */
  isStarted(): Promise<boolean>
  /**
   * Returns whether the speech pipeline is currently activated
   *
   * @example
   * ```js
   * console.log(`isActivated: ${await Spokestack.isActivated()}`)
   * ```
   */
  isActivated(): Promise<boolean>
  /**
   * Bind to any event emitted by the native libraries
   * See Events for a list of all available events.
   *
   * @param eventType name of the event for which we are registering listener
   * @param listener the listener function
   * @param context context of the listener
   *
   * @example
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
  addEventListener(
    eventType: string,
    listener: (event: any) => void,
    context?: Object
  ): EmitterSubscription
  /**
   * Remove an event listener
   *
   * @param eventType - Name of the event to emit
   * @param listener - Function to invoke when the specified event is emitted
   *
   * @example
   * ```js
   * Spokestack.removeEventListener('recognize', onRecognize)
   * ```
   */
  removeEventListener(
    eventType: string,
    listener: (...args: any[]) => any
  ): void
  /**
   * Remove any existing listeners
   *
   * @example
   * ```js
   * Spokestack.removeAllListeners()
   * ```
   */
  removeAllListeners(): void
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
  // Set refreshModels to true in development by default
  if (typeof config.refreshModels !== 'boolean') {
    config.refreshModels = __DEV__
  }

  /**
   * Wakeword
   */

  // Resolve source objects to URLs for local downloads
  const wakewordConfig = (config.wakeword || {}) as WakewordConfig
  if (typeof wakewordConfig.detect === 'number') {
    wakewordConfig.detect = resolveModelUrl(wakewordConfig.detect)
  }
  if (typeof wakewordConfig.encode === 'number') {
    wakewordConfig.encode = resolveModelUrl(wakewordConfig.encode)
  }
  if (typeof wakewordConfig.filter === 'number') {
    wakewordConfig.filter = resolveModelUrl(wakewordConfig.filter)
  }
  // Convert wakewords to a comma-separated list if an array
  if (Array.isArray(wakewordConfig.wakewords)) {
    wakewordConfig.wakewords = wakewordConfig.wakewords.join(',')
  }
  const hasWakeword = !!(
    wakewordConfig.filter &&
    wakewordConfig.detect &&
    wakewordConfig.encode
  )

  /**
   * Keyword
   */

  // Resolve source objects to URLs for local downloads
  const keywordConfig = (config.keyword || {}) as KeywordConfig
  if (typeof keywordConfig.detect === 'number') {
    keywordConfig.detect = resolveModelUrl(keywordConfig.detect)
  }
  if (typeof keywordConfig.encode === 'number') {
    keywordConfig.encode = resolveModelUrl(keywordConfig.encode)
  }
  if (typeof keywordConfig.filter === 'number') {
    keywordConfig.filter = resolveModelUrl(keywordConfig.filter)
  }
  const keywordMetadataConfig = keywordConfig as KeywordWithMetadataConfig
  if (typeof keywordMetadataConfig.metadata === 'number') {
    keywordMetadataConfig.metadata = resolveModelUrl(
      keywordMetadataConfig.metadata
    )
  }
  const keywordClassesConfig = keywordConfig as KeywordWithClassesConfig
  // Convert classes to a comma-separated list if an array
  if (Array.isArray(keywordClassesConfig.classes)) {
    keywordClassesConfig.classes = keywordClassesConfig.classes.join(',')
  }
  const hasKeyword = !!(
    keywordConfig.filter &&
    keywordConfig.detect &&
    keywordConfig.encode &&
    (keywordClassesConfig.classes || keywordMetadataConfig.metadata)
  )

  // Set default profile based on presence of wakeword or keyword config
  // Do not set a default if profile is set explicitly
  if (!config.pipeline?.profile) {
    config.pipeline = config.pipeline || {}
    if (hasWakeword && !hasKeyword) {
      // If wakeword is set and keyword is not,
      // default to a profile that works with wakeword.
      config.pipeline.profile = PipelineProfile.TFLITE_WAKEWORD_NATIVE_ASR
    } else if (!hasWakeword && hasKeyword) {
      // If keyword is set, and wakeword is not,
      // default to a profile that works with keyword.
      config.pipeline.profile = PipelineProfile.VAD_KEYWORD_ASR
    } else if (hasWakeword && hasKeyword) {
      // If both keyword and wakeword are set,
      // default to a profile that works for both.
      config.pipeline.profile = PipelineProfile.TFLITE_WAKEWORD_KEYWORD
    }
  }

  /**
   * NLU
   */
  const nluConfig = (config.nlu || {}) as NLUConfig
  if (typeof nluConfig.model === 'number') {
    nluConfig.model = resolveModelUrl(nluConfig.model)
  }
  if (typeof nluConfig.metadata === 'number') {
    nluConfig.metadata = resolveModelUrl(nluConfig.metadata)
  }
  if (typeof nluConfig.vocab === 'number') {
    nluConfig.vocab = resolveModelUrl(nluConfig.vocab)
  }
  return originalInit(id, secret, config)
}

// Remove all JS listeners as well as calling
// destroy natively
const originalDestroy = Spokestack.destroy
Spokestack.destroy = () => {
  originalDestroy()
  // Remove listeners after destroy
  Spokestack.removeAllListeners()
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
  destroy,
  start,
  stop,
  activate,
  deactivate,
  synthesize,
  speak,
  classify,
  isInitialized,
  isStarted,
  isActivated,
  addEventListener,
  removeEventListener,
  removeAllListeners
} = Spokestack as SpokestackType
export default Spokestack as SpokestackType
