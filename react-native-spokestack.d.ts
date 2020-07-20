export = RNSpokestack;
export as namespace RNSpokestack;

declare namespace RNSpokestack {
  enum TraceLevel {
    DEBUG = 10,
    PERF = 20,
    INFO = 30,
    NONE = 100,
  }

  enum TTSFormat {
    TEXT = 0,
    SSML = 1,
    SPEECHMARKDOWN = 2,
  }

  interface SpokestackRecognizeEvent {
    transcript?: string;
  }

  interface SpokestackErrorEvent {
    error?: string;
  }

  interface SpokestackTraceEvent {
    message?: string;
  }

  interface SpokestackTTSEvent {
    url?: string;
  }

  interface NLUSlot {
    type: string;
    value: string;
  }

  interface SpokestackNLUEvent {
    result?: {
      intent: string;
      confidence: number;
      slots: NLUSlot[];
    };
  }

  interface SynthesizeOptions {
    input: string;
    format: TTSFormat;
    voice: string;
  }

  type SpokestackEvent = SpokestackRecognizeEvent &
    SpokestackErrorEvent &
    SpokestackTraceEvent &
    SpokestackTTSEvent &
    SpokestackNLUEvent;

  type SpokestackInput =
    | "io.spokestack.spokestack.android.MicrophoneInput"
    | "io.spokestack.spokestack.android.NoInput"
    | "io.spokestack.spokestack.android.PreASRMicrophoneInput";

  type SpokestackVoiceActivity =
    | "io.spokestack.spokestack.webrtc.VoiceActivityDetector"
    | "io.spokestack.spokestack.webrtc.VoiceActivityTrigger"
    // Specify the two above, the one below, or none
    | "io.spokestack.spokestack.wakeword.WakewordTrigger";

  // Only specify one of these
  type SpokestackSpeechRecognizer =
    | "io.spokestack.spokestack.android.AndroidSpeechRecognizer"
    | "io.spokestack.spokestack.google.GoogleSpeechRecognizer"
    | "io.spokestack.spokestack.microsoft.AzureSpeechRecognizer";

  // Important: follow this order when specifying stages
  type SpokestackStage =
    | "io.spokestack.spokestack.webrtc.AcousticNoiseSuppressor"
    | "io.spokestack.spokestack.webrtc.AutomaticGainControl"
    | SpokestackVoiceActivity
    | SpokestackSpeechRecognizer
    | "io.spokestack.spokestack.ActivationTimeout";

  /**
   * Configuration is mostly Android-based.
   * Spokestack-iOS takes some of these values and
   * decides what they mean for iOS, as config for iOS is simpler.
   */
  interface SpokestackConfig {
    /**
     * Required for Android.
     * Specifies which input processor to use.
     */
    input?: SpokestackInput;
    /**
     * Stages is an array of classes through which to pass input
     * Only the wakeword stage is relevant in iOS
     */
    stages: SpokestackStage[];
    properties?: {
      /**
       * Audio sampling rate, in Hz
       */
      "sample-rate"?: number;
      /**
       * Speech frame width, in ms
       */
      "frame-width"?: number;
      /**
       * Trace level for logs
       * DEBUG, PERF, INFO, and NONE
       */
      "trace-level"?: TraceLevel;

      /**
       * Some of these properties are passed directly to spokestack-ios
       * and spokestack-android
       * spokestack-ios reference: https://spokestack.github.io/spokestack-ios/index.html
       * spokestack-android reference: https://javadoc.io/doc/io.spokestack/spokestack-android/latest/index.html
       */
      /**
       * File system path to the "filter" Tensorflow-Lite model,
       * which is used to calculate a mel spectrogram frame from the linear STFT;
       * its inputs should be shaped [fft-width], and its outputs [mel-width]
       */
      "wake-filter-path"?: string;
      /**
       * File system path to the "encode" Tensorflow-Lite model,
       * which is used to perform each autoregressive step over the mel frames;
       * its inputs should be shaped [mel-length, mel-width], and its outputs [encode-width],
       * with an additional state input/output shaped [state-width]
       */
      "wake-detect-path"?: string;
      /**
       * File system path to the "detect" Tensorflow-Lite model;
       * its inputs shoudld be shaped [encode-length, encode-width],
       * and its outputs
       */
      "wake-encode-path"?: string;

      /**
       * iOS-only
       * A comma-separated list of wakeword keywords
       * Only necessary when not passing the filter, detect, and encode paths.
       */
      wakewords?: string;

      // Android-only AcousticNoiseSuppressor
      /**
       * Noise policy
       */
      "ans-policy"?: "mild" | "medium" | "aggressive" | "very-aggressive";

      // Android-only AcousticGainControl
      /**
       * target peak audio level, in -dBFS for example,
       * to maintain a peak of -9dBFS, configure a value of 9
       */
      "agc-compression-gain-db"?: number;
      /**
       * dynamic range compression rate, in dB
       */
      "agc-target-level-dbfs"?: number;

      // Android-only VoiceActivityDetector
      /**
       * Detector mode
       */
      "vad-mode"?: "quality" | "low-bitrate" | "aggressive" | "very-aggressive";
      /**
       * Rising-edge detection run length, in ms; this value determines
       * how many positive samples must be received to flip the detector to positive
       */
      "vad-rise-delay"?: number;
      /**
       * Falling-edge detection run length, in ms; this value determines
       * how many negative samples must be received to flip the detector to negative
       */
      "vad-fall-delay"?: number;

      //
      // Android-only wakeword
      // -----------------------------------------------
      /**
       * The minimum length of an activation, in milliseconds,
       * used to ignore a VAD deactivation after the wakeword
       */
      "wake-active-min"?: number;
      /**
       * The maximum length of an activation, in milliseconds,
       * used to time out the activation
       */
      "wake-active-max"?: number;
      /**
       * The desired linear Root Mean Squared (RMS) signal energy,
       * which is used for signal normalization and should be tuned
       * to the RMS target used during training
       */
      "rms-target"?: number;
      /**
       * The Exponentially-Weighted Moving Average (EWMA) update
       * rate for the current RMS signal energy (0 for no RMS normalization)
       */
      "rms-alpha"?: number;
      /**
       * The pre-emphasis filter weight to apply to
       * the normalized audio signal (0 for no pre-emphasis)
       */
      "pre-emphasis"?: number;
      /**
       * The size of the signal window used to calculate the STFT,
       * in number of samples - should be a power of 2 for maximum efficiency
       */
      "fft-window-size"?: number;
      /**
       * The name of the windowing function to apply to each audio frame
       * before calculating the STFT; currently the "hann" window is supported
       */
      "fft-window-type"?: string;
      /**
       * The length of time to skip each time the
       * overlapping STFT is calculated, in milliseconds
       */
      "fft-hop-length"?: number;
      /**
       * The length of time to skip each time the
       * overlapping STFT is calculated, in milliseconds
       */
      "mel-frame-length"?: number;
      /**
       * The size of each mel spectrogram frame,
       * in number of filterbank components
       */
      "mel-frame-width"?: number;
      /**
       * The length of the sliding window of encoder output
       * used as an input to the classifier, in milliseconds
       */
      "wake-encode-length"?: number;
      /**
       * The size of the encoder output, in vector units
       */
      "wake-encode-width"?: number;
      /**
       * The size of the encoder state, in vector units (defaults to wake-encode-width)
       */
      "wake-state-width"?: number;
      /**
       * The threshold of the classifier's posterior output,
       * above which the trigger activates the pipeline, in the range [0, 1]
       */
      "wake-threshold"?: number;

      //
      // Android-only Speech Recognizer
      // -----------------------------------------------
      /**
       * Language code for speech recognition
       * Used in both Azure and Google Speech Recognizers
       */
      locale?: string;

      // AzureSpeechRecognizer
      /**
       * API key for the Azure Speech service
       */
      "azure-api-key"?: string;
      /**
       * Azure Speech service region
       */
      "azure-region"?: string;

      // GoogleSpeechRecognizer
      /**
       * Google speech credentials.
       * Only necessary when using the GoogleSpeechRecognizer stage
       */
      "google-credentials"?: string;
    };
    tts?: {
      ttsServiceClass?: string; // Android-only
      /**
       * Spokestack API credentials
       * Can be generated after creating an account
       * https://spokestack.io/create
       */
      "spokestack-id"?: string;
      "spokestack-secret"?: string;
    };
    nlu?: {
      // NLU settings.
      // Only set these if you are calling `Spokestack.classify`.
      /**
       * String filesystem path to NLU model
       */
      "nlu-model-path"?: string;
      /**
       * String filesystem path to NLU metadata
       */
      "nlu-metadata-path"?: string;
      /**
       * String filesystem path to NLU vocab
       */
      "wordpiece-vocab-path"?: string;
    };
  }

  function initialize(config: SpokestackConfig): void;
  function activate(): void;
  function deactivate(): void;
  function start(): void;
  function stop(): void;
  function classify(
    transcript: string,
    options?: Record<string, unknown>
  ): void;
  function synthesize(options: SynthesizeOptions): void;

  function onInit(event: Record<string, unknown>): void;
  function onActivate(event: Record<string, unknown>): void;
  function onDeactivate(event: Record<string, unknown>): void;
  function onStart(event: Record<string, unknown>): void;
  function onStop(event: Record<string, unknown>): void;
  function onRecognize(event: SpokestackRecognizeEvent): void;
  function onTimeout(event: Record<string, unknown>): void;
  function onTrace(event: SpokestackTraceEvent): void;
  function onError(event: SpokestackErrorEvent): void;
  function onSuccess(event: SpokestackTTSEvent): void;
  function onFailure(event: SpokestackErrorEvent): void;
  function onClassification(event: SpokestackNLUEvent): void;
}
