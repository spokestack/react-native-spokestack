export = RNSpokestack;
export as namespace RNSpokestack;

declare namespace RNSpokestack {
  export function constructor(props?: object): void;

  export enum TraceLevel {
    DEBUG = 10,
    PERF = 20,
    INFO = 30,
    NONE = 100,
  }

  export enum TTSFormat {
    TEXT = 0,
    SSML = 1,
    SPEECHMARKDOWN = 2,
  }

  interface SpokestackRecognizeEvent {
    transcript: string;
  }

  interface SpokestackErrorEvent {
    error: string;
  }

  interface SpokestackTraceEvent {
    message: string;
  }

  interface SpokestackTTSEvent {
    url: string;
  }

  interface NLUSlot {
    type: string;
    value: string;
  }

  export interface SpokestackNLUEvent {
    result: {
      intent: string;
      confidence: string;
      slots: NLUSlot[];
    };
  }

  interface SynthesizeOptions {
    input: string;
    format: TTSFormat;
    voice: string;
  }

  export interface SpokestackConfig {
    input: string;
    stages: string[];
    properties: {
      locale?: string;
      "agc-compression-gain-db"?: number;
      "google-credentials"?: string; // only set if using `GoogleSpeechRecognizer` stage above
      "trace-level"?: TraceLevel;
    };
    tts: {
      ttsServiceClass?: string;
      // These can be generated at spokestack.io after creating an account
      "spokestack-id"?: string;
      "spokestack-secret"?: string;
    };
    nlu: {
      // NLU settings. Only set these if you are calling `Spokestack.classify`.
      "nlu-model-path"?: string; // string filesystem path to nlu model
      "nlu-metadata-path"?: string; // string filesystem path to nlu metadata
      "wordpiece-vocab-path"?: string; // string filesystem path to nlu vocab
    };
  }

  export function initialize(config: SpokestackConfig): void;
  export function activate(): void;
  export function deactivate(): void;
  export function start(): void;
  export function stop(): void;
  export function classify(transcript: string, options?: {}): Promise<string>;
  export function synthesize(options: SynthesizeOptions): Promise<string>;

  export function onActivate(event: {}): void;
  export function onDeactivate(event: {}): void;
  export function onStart(event: {}): void;
  export function onStop(event: {}): void;
  export function onRecognize(event: SpokestackRecognizeEvent): void;
  export function onTimeout(event: {}): void;
  export function onTrace(event: SpokestackTraceEvent): void;
  export function onError(event: SpokestackErrorEvent): void;
  export function onSuccess(event: SpokestackTTSEvent): void;
  export function onFailure(event: SpokestackErrorEvent): void;
  export function onClassification(event: SpokestackNLUEvent): void;
}
