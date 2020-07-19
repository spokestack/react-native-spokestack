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

  interface SpokestackConfig {
    input: string;
    stages: string[];
    properties?: {
      "agc-compression-gain-db"?: number;
      "agc-target-level-dbfs"?: number;
      "frame-width"?: number;
      "fft-window-size"?: number;
      "fft-hop-length"?: number;
      locale?: string;
      "pre-emphasis"?: number;
      "sample-rate"?: number;
      "vad-fall-delay"?: number;

      // Wakeword
      wakewords?: string;
      "wake-filter-path"?: string;
      "wake-detect-path"?: string;
      "wake-encode-path"?: string;
      "wake-phrase-length"?: number;
      "wake-smooth-length"?: number;
      "wake-threshold"?: number;
      "wake-active-min"?: number;
      "wake-active-max"?: number;

      "google-credentials"?: string; // only set if using `GoogleSpeechRecognizer` stage above
      "trace-level"?: TraceLevel;
    };
    tts?: {
      ttsServiceClass?: string;
      // These can be generated at spokestack.io after creating an account
      "spokestack-id"?: string;
      "spokestack-secret"?: string;
    };
    nlu?: {
      // NLU settings. Only set these if you are calling `Spokestack.classify`.
      "nlu-model-path"?: string; // string filesystem path to nlu model
      "nlu-metadata-path"?: string; // string filesystem path to nlu metadata
      "wordpiece-vocab-path"?: string; // string filesystem path to nlu vocab
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
