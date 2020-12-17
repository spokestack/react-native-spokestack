export type RequireSource = number

/**
 * Pipeline profiles set up the speech pipeline based on your needs
 */
export enum PipelineProfile {
  /**
   * Set up wakeword and use local Apple/Android ASR.
   * Note that wakeword.filter, wakeword.encode, and wakeword.detect
   *  are required if any wakeword profile is used.
   */
  TFLITE_WAKEWORD_NATIVE_ASR = 0,
  /**
   * Apple/Android Automatic Speech Recognition is on
   * when Voice Active Detection triggers it.
   */
  VAD_NATIVE_ASR = 1,
  /**
   * Apple/Android Automatic Speech Recogntion is on
   * when the speech pipeline is active.
   * This is likely the more common profile
   * when not using wakeword.
   */
  PTT_NATIVE_ASR = 2,
  /**
   * Set up wakeword and use remote Spokestack ASR.
   * Note that wakeword.filter, wakeword.encode, and wakeword.detect
   *  are required if any wakeword profile is used.
   */
  TFLITE_WAKEWORD_SPOKESTACK_ASR = 3,
  /**
   * Spokestack Automatic Speech Recognition is on
   * when Voice Active Detection triggers it.
   */
  VAD_SPOKESTACK_ASR = 4,
  /**
   * Spokestack Automatic Speech Recogntion is on
   * when the speech pipeline is active.
   * This is likely the more common profile
   * when not using wakeword, but Spokestack ASR is preferred.
   */
  PTT_SPOKESTACK_ASR = 5
}

/**
 * How much logging to show
 * A lower number means more logs.
 */
export enum TraceLevel {
  DEBUG = 10,
  PERF = 20,
  INFO = 30,
  NONE = 100
}

/**
 * Three formats are supported when using Spokestack TTS.
 * Raw text, SSML, and Speech Markdown.
 * See https://www.speechmarkdown.org/ if unfamiliar with Speech Markdown.
 * IPA is expected when using SSML or Speech Markdown.
 */
export enum TTSFormat {
  TEXT = 0,
  SSML = 1,
  SPEECHMARKDOWN = 2
}

export interface SpokestackRecognizeEvent {
  transcript: string
}

export interface SpokestackErrorEvent {
  error: string
}

export interface SpokestackTraceEvent {
  message: string
}

export interface SpokestackPlayEvent {
  playing: boolean
}

export type SpokestackEvent =
  | SpokestackRecognizeEvent
  | SpokestackErrorEvent
  | SpokestackTraceEvent
  | SpokestackPlayEvent

export interface SpokestackNLUSlot {
  type: string
  value: string
}

export interface SpokestackNLUResult {
  intent: string
  confidence: number
  slots: SpokestackNLUSlot[]
}

export interface PipelineConfig {
  /**
   * Profiles are collections of common configurations for Pipeline stages.
   * If Wakeword config files are specified, the default will be
   * `TFLITE_WAKEWORD_NATIVE_ASR`.
   * Otherwise, the default is `PTT_NATIVE_ASR`.
   */
  profile?: PipelineProfile
  /**
   * Audio sampling rate, in Hz
   */
  sampleRate?: number
  /**
   * @advanced
   *
   * Speech frame width, in ms
   */
  frameWidth?: number
  /**
   * @advanced
   *
   * Buffer width, used with frameWidth to determine the buffer size
   */
  bufferWidth?: number
  /**
   * Voice activity detector mode
   */
  vadMode?: 'quality' | 'low-bitrate' | 'aggressive' | 'very-aggressive'
  /**
   * @advanced
   *
   * Falling-edge detection run length, in ms; this value determines
   * how many negative samples must be received to flip the detector to negative
   */
  vadFallDelay?: number
  /**
   * @advanced
   *
   * Android-only
   *
   * Rising-edge detection run length, in ms; this value determines
   * how many positive samples must be received to flip the detector to positive
   */
  vadRiseDelay?: number
  /**
   * @advanced
   *
   * Android-only for AcousticNoiseSuppressor
   *
   * Noise policy
   */
  ansPolicy?: 'mild' | 'medium' | 'aggressive' | 'very-aggressive'
  /**
   * @advanced
   *
   * Android-only for AcousticGainControl
   *
   * Target peak audio level, in -dB,
   * to maintain a peak of -9dB, configure a value of 9
   */
  agcCompressionGainDb?: number
  /**
   * @advanced
   *
   * Android-only for AcousticGainControl
   *
   * Dynamic range compression rate, in dBFS
   */
  agcTargetLevelDbfs?: number
}

export interface NLUConfig {
  /**
   * The NLU Tensorflow-Lite model. If specified, metadata and vocab are also required.
   *
   * This field accepts 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `model: require('./nlu.tflite')`)
   */
  model: string | RequireSource
  /**
   * The JSON file for NLU metadata. If specified, model and vocab are also required.
   *
   * This field accepts 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `metadata: require('./metadata.json')`)
   */
  metadata: string | RequireSource
  /**
   * A txt file containing the NLU vocabulary. If specified, model and metadata are also required.
   *
   * This field accepts 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `vocab: require('./vocab.txt')`)
   */
  vocab: string | RequireSource
  /*
   * @advanced
   *
   * Android-only
   *
   * Padded length of the model's input sequences.
   * Defaults to 128 and should only be changed if this parameter
   * is explicitly set to a different value at training time.
   */
  inputLength?: number
}

export interface WakewordConfig {
  /**
   * The "filter" Tensorflow-Lite model. If specified, detect and encode are also required.
   *
   * This field accepts 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `filter: require('./filter.tflite')`)
   *
   * The filter model is used to calculate a mel spectrogram frame from the linear STFT;
   * its inputs should be shaped [fft-width], and its outputs [mel-width]
   */
  filter: string | RequireSource
  /**
   * The "detect" Tensorflow-Lite model. If specified, filter and encode are also required.
   *
   * This field accepts 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `detect: require('./detect.tflite')`)
   *
   * The encode model is used to perform each autoregressive step over the mel frames;
   * its inputs should be shaped [mel-length, mel-width], and its outputs [encode-width],
   * with an additional state input/output shaped [state-width]
   */
  detect: string | RequireSource
  /**
   * The "encode" Tensorflow-Lite model. If specified, filter and detect are also required.
   *
   * This field accepts 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `encode: require('./encode.tflite')`)
   *
   * Its inputs should be shaped [encode-length, encode-width],
   * and its outputs
   */
  encode: string | RequireSource
  /**
   * The minimum length of an activation, in milliseconds,
   * used to ignore a VAD deactivation after the wakeword
   */
  activeMin?: number
  /**
   * The maximum length of an activation, in milliseconds,
   * used to time out the activation
   */
  activeMax?: number
  /**
   * iOS-only
   *
   * A comma-separated list of wakeword keywords
   * Only necessary when not passing the filter, detect, and encode paths.
   */
  wakewords?: string
  /**
   * iOS-only
   *
   * Length of time to allow an Apple ASR request to run, in milliseconds.
   * Apple has an undocumented limit of 60000ms per request.
   */
  requestTimeout?: number
  /**
   * @advanced
   *
   * The threshold of the classifier's posterior output,
   * above which the trigger activates the pipeline, in the range [0, 1]
   */
  threshold?: number
  /**
   * @advanced
   *
   * The length of the sliding window of encoder output
   * used as an input to the classifier, in milliseconds
   */
  encodeLength?: number
  /**
   * @advanced
   *
   * The size of the encoder output, in vector units
   */
  encodeWidth?: number
  /**
   * @advanced
   *
   * The size of the encoder state, in vector units (defaults to wake-encode-width)
   */
  stateWidth?: number
  /**
   * @advanced
   *
   * The desired linear Root Mean Squared (RMS) signal energy,
   * which is used for signal normalization and should be tuned
   * to the RMS target used during training
   */
  rmsTarget?: number
  /**
   * @advanced
   *
   * The Exponentially-Weighted Moving Average (EWMA) update
   * rate for the current RMS signal energy (0 for no RMS normalization)
   */
  rmsAlpha?: number
  /**
   * @advanced
   *
   * The size of the signal window used to calculate the STFT,
   * in number of samples - should be a power of 2 for maximum efficiency
   */
  fftWindowSize?: number
  /**
   * @advanced
   *
   * Android-only
   *
   * The name of the windowing function to apply to each audio frame
   * before calculating the STFT; currently the "hann" window is supported
   */
  fftWindowType?: string
  /**
   * @advanced
   *
   * The length of time to skip each time the
   * overlapping STFT is calculated, in milliseconds
   */
  fftHopLength?: number
  /**
   * @advanced
   *
   * The pre-emphasis filter weight to apply to
   * the normalized audio signal (0 for no pre-emphasis)
   */
  preEmphasis?: number
  /**
   * @advanced
   *
   * The length of time to skip each time the
   * overlapping STFT is calculated, in milliseconds
   */
  melFrameLength?: number
  /**
   * @advanced
   *
   * The size of each mel spectrogram frame,
   * in number of filterbank components
   */
  melFrameWidth?: number
}

/**
 * Spokestack-iOS reference: https://spokestack.github.io/spokestack-ios/index.html
 * spokestack-android reference: https://javadoc.io/doc/io.spokestack/spokestack-android/latest/index.html
 */
export interface SpokestackConfig {
  /**
   * This option is only used when remote URLs are passed to fields such as `wakeword.filter`.
   *
   * Set this to true to allow downloading models over cellular.
   * Note that `Spokestack.initialize()` will still reject the promise if
   * models need to be downloaded but there is no network at all.
   *
   * Ideally, the app will include network handling itself and
   * inform the user about file downloads.
   *
   * Default: false
   */
  allowCellularDownloads?: boolean
  /**
   * Wakeword and NLU model files are cached internally.
   * Set this to true whenever a model is changed
   * during development to refresh the internal model cache.
   *
   * This affects models passed with `require()` as well
   * as models downloaded from remote URLs.
   *
   * Default: false
   */
  refreshModels?: boolean
  /**
   * This controls the log level for the underlying native
   * iOS and Android libraries.
   * See the TraceLevel enum for values.
   */
  traceLevel?: TraceLevel
  /**
   * Most of these options are advanced aside from "profile"
   */
  pipeline?: PipelineConfig
  /** Only needed if using Spokestack.classify */
  nlu?: NLUConfig
  /**
   * Only required for wakeword
   * Most options are advanced aside from
   * filter, encode, and decode for specifying config files.
   */
  wakeword?: WakewordConfig
}
