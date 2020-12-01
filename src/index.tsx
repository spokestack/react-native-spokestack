import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform
} from 'react-native'
import {
  PipelineProfile,
  SpokestackConfig,
  SpokestackEvent,
  SpokestackNLUResult,
  TTSFormat,
  TraceLevel
} from './types'

const { Spokestack } = NativeModules

// Event emitter
const emitter = new NativeEventEmitter(Spokestack)

interface SpokestackType {
  PipelineProfile: typeof PipelineProfile
  TraceLevel: typeof TraceLevel
  TTSFormat: typeof TTSFormat
  /**
   * Initialize the speech pipeline; required for all other methods
   * See below for all available options.
   *
   * ```js
   * Spokestack.initialize(process.env.CLIENT_ID, process.env.CLIENT_SECRET, {
   *  pipeline: {
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
   */
  start(): Promise<void>
  /**
   * Stop the speech pipeline.
   * This effectively stops ASR, VAD, and wakeword.
   */
  stop(): Promise<void>
  /**
   * Manually activate the speech pipeline.
   * This is necessary when using a PTT profile.
   * VAD profiles can also activate ASR without the need
   * to call this method.
   */
  activate(): Promise<void>
  /**
   * Deactivate the speech pipeline.
   * If the profile includes wakeword, the pipeline will go back
   * to listening for the wakeword.
   * If VAD is active, the pipeline can reactivate without calling activate().
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
   * Classify the utterance with an intent/slot Natural Language Understanding model
   */
  classify(utterance: string): Promise<SpokestackNLUResult>
  /**
   * Bind to any event emitted by the native libraries
   * The events are: "recognize", "error", "activate", "deactivate", and "timeout"
   * "partial_recognize" is available on Android only.
   *
   * ```js
   * useEffect(() => {
   *   const listener = Spokestack.addEventListener('recognize', onSpeech)
   *   // Unsubsribe by calling remove when components are unmounted
   *   return () => {
   *     listener.remove()
   *   }
   * }, [])
   *
   * ```
   */
  addEventListener: typeof emitter.addListener
  /**
   * Remove an event listener
   *
   * ```js
   * Spokestack.removeEventListener('speech', onSpeech)
   * ```
   */
  removeEventListener: typeof emitter.removeListener
}

// Add enums as values
Spokestack.PipelineProfile = PipelineProfile
Spokestack.TraceLevel = TraceLevel
Spokestack.TTSFormat = TTSFormat

Spokestack.addEventListener = (
  type: string,
  listener: (event: SpokestackEvent) => void
) => emitter.addListener(type, listener)

Spokestack.removeEventListener = (
  type: string,
  listener: (event: SpokestackEvent) => void
) => emitter.removeListener(type, listener)

// Ensure method is called with proper number of args despite what's passed
const initialize = Spokestack.initialize
Spokestack.initialize = (
  id: string,
  secret: string,
  config: SpokestackConfig = {}
) => initialize(id, secret, config)

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

// Export types to be used as separate exports
export * from './types'
export default Spokestack as SpokestackType
