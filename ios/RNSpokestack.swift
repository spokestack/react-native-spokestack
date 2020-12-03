import Spokestack

enum RNSpokestackError: Error {
    case notInitialized
    case notStarted
    case tts
}

enum RNSpokestackPromise: String {
    case initialize
    case start
    case stop
    case activate
    case deactivate
    case synthesize
    case speak
    case classify
}

@objc(RNSpokestack)
class RNSpokestack: RCTEventEmitter, SpokestackDelegate {
    var speechPipeline: SpeechPipeline?
    var speechConfig: SpeechConfiguration = SpeechConfiguration()
    var speechContext: SpeechContext?
    var synthesizer: TextToSpeech?
    var classifier: NLUTensorflow?
    var started = false
    var resolvers: [RNSpokestackPromise:RCTPromiseResolveBlock] = [:]
    var rejecters: [RNSpokestackPromise:RCTPromiseRejectBlock] = [:]

    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["activate", "deactivate", "timeout", "recognize", "partial_recognize", "play", "error", "trace"]
    }

    func handleError(_ error: Error) -> Void {
        print(error)
        sendEvent(withName: "error", body: [ "error": error.localizedDescription ])
    }

    func failure(error: Error) {
        handleError(error)

        // Reject all existing promises
        for (key, reject) in rejecters {
            let value = key.rawValue
            reject(String(format: "%@_error", value), String(format: "Spokestack error during %@.", value), error)
        }
        // Reset
        resolvers = [:]
        rejecters = [:]
    }
    
    func didTrace(_ trace: String) {
        sendEvent(withName: "trace", body: [ "message": trace ])
    }

    func didInit() {
        print("Spokestack initialized!")
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.initialize) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.initialize)
        }
    }

    func didActivate() {
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.activate) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.activate)
        }
        sendEvent(withName: "activate", body: [ "transcript": "" ])
    }

    func didDeactivate() {
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.deactivate) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.deactivate)
        }
        sendEvent(withName: "deactivate", body: [ "transcript": "" ])
    }

    func didStart() {
        started = true
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.start) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.start)
        }
    }

    func didStop() {
        started = false
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.stop) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.stop)
        }
    }

    func didTimeout() {
        sendEvent(withName: "timeout", body: [ "transcript": "" ])
    }

    func didRecognize(_ result: SpeechContext) {
        sendEvent(withName: "recognize", body: [ "transcript": result.transcript ])
    }

    func didRecognizePartial(_ result: SpeechContext) {
        sendEvent(withName: "partial_recognize", body: [ "transcript": result.transcript ])
    }

    func success(result: TextToSpeechResult) {
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.synthesize) {
            resolve(result.url)
            rejecters.removeValue(forKey: RNSpokestackPromise.synthesize)
        } else if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.speak) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.speak)
        }
    }

    func classification(result: NLUResult) {
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.classify) {
            for (name, slot) in result.slots! {
                print(name, slot)
            }
            resolve([
                "intent": result.intent,
                "confidence": result.confidence,
                "slots": result.slots!.map { (name, slot) in [
                    "type": slot.type,
                    "value": slot.value ?? nil,
                    "rawValue": slot.rawValue ?? nil
                ] }
            ])
            rejecters.removeValue(forKey: RNSpokestackPromise.classify)
        }
    }

    func didBeginSpeaking() {
        if let resolve = resolvers.removeValue(forKey: RNSpokestackPromise.speak) {
            resolve(nil)
            rejecters.removeValue(forKey: RNSpokestackPromise.speak)
        }
        sendEvent(withName: "play", body: [ "playing": true ])
    }

    func didFinishSpeaking() {
        sendEvent(withName: "play", body: [ "playing": false ])
    }

    /// Initialize the speech pipeline
    /// - Parameters:
    ///   - clientId: Spokestack client ID token available from https://spokestack.io
    ///   - clientSecret: Spokestack client Secret token available from https://spokestack.io
    ///   - config: Spokestack config object to be used for initializing the Speech Pipeline.
    ///     See https://github.com/spokestack/react-native-spokestack for available options
    @objc(initialize:withClientSecret:withConfig:withResolver:withRejecter:)
    func initialize(clientId: String, clientSecret: String, config: Dictionary<String, Any>?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if speechPipeline != nil {
            return
        }
        speechContext = SpeechContext(speechConfig)
        speechConfig.apiId = clientId
        speechConfig.apiSecret = clientSecret
        var builder = SpeechPipelineBuilder()
        builder = builder.useProfile(SpeechPipelineProfiles.pushToTalkAppleSpeech)
        var nluFiles = 0
        for (key, value) in config! {
            switch key {
            case "traceLevel":
                speechConfig.tracing = Trace.Level.init(rawValue: RCTConvert.nsInteger(value)) ?? Trace.Level.NONE
                break
            case "nlu":
                // All values in pipeline are Strings
                // so no RCTConvert calls are needed
                for (nluKey, nluValue) in value as! Dictionary<String, String> {
                    switch nluKey {
                    case "modelPath":
                        speechConfig.nluModelPath = nluValue
                        nluFiles += 1
                        break
                    case "metadataPath":
                        speechConfig.nluModelMetadataPath = nluValue
                        nluFiles += 1
                        break
                    case "vocabPath":
                        speechConfig.nluVocabularyPath = nluValue
                        nluFiles += 1
                        break
                    default:
                        break
                    }
                }
            case "wakeword":
                for (wakeKey, wakeValue) in value as! Dictionary<String, Any> {
                    switch wakeKey {
                    case "filterPath":
                        speechConfig.filterModelPath = RCTConvert.nsString(wakeValue)
                        break
                    case "detectPath":
                        speechConfig.detectModelPath = RCTConvert.nsString(wakeValue)
                        break
                    case "encodePath":
                        speechConfig.encodeModelPath = RCTConvert.nsString(wakeValue)
                        break
                    case "activeMin":
                        speechConfig.wakeActiveMin = RCTConvert.nsInteger(wakeValue)
                        break
                    case "activeMax":
                        speechConfig.wakeActiveMax = RCTConvert.nsInteger(wakeValue)
                        break
                    case "wakewords":
                        speechConfig.wakewords = RCTConvert.nsString(wakeValue)
                        break
                    case "requestTimeout":
                        speechConfig.wakewordRequestTimeout = RCTConvert.nsInteger(wakeValue)
                        break
                    case "threshold":
                        speechConfig.wakeThreshold = RCTConvert.nsNumber(wakeValue)!.floatValue
                        break
                    case "encodeLength":
                        speechConfig.encodeLength = RCTConvert.nsInteger(wakeValue)
                        break
                    case "stateWidth":
                        speechConfig.stateWidth = RCTConvert.nsInteger(wakeValue)
                        break
                    case "rmsTarget":
                        speechConfig.rmsTarget = RCTConvert.nsNumber(wakeValue)!.floatValue
                        break
                    case "rmsAlpha":
                        speechConfig.rmsAlpha = RCTConvert.nsNumber(wakeValue)!.floatValue
                        break
                    case "fftWindowSize":
                        speechConfig.fftWindowSize = RCTConvert.nsInteger(wakeValue)
                        break
                    case "fftWindowType":
                        speechConfig.fftWindowType = SignalProcessing.FFTWindowType(rawValue: RCTConvert.nsString(wakeValue)) ?? SignalProcessing.FFTWindowType.hann
                        break
                    case "fftHopLength":
                        speechConfig.fftHopLength = RCTConvert.nsInteger(wakeValue)
                        break
                    case "preEmphasis":
                        speechConfig.preEmphasis = RCTConvert.nsNumber(wakeValue)!.floatValue
                        break
                    case "melFrameLength":
                        speechConfig.melFrameLength = RCTConvert.nsInteger(wakeValue)
                        break
                    case "melFrameWidth":
                        speechConfig.melFrameWidth = RCTConvert.nsInteger(wakeValue)
                        break
                    default:
                        break
                    }
                }
            case "pipeline":
                // All values in pipeline happen to be Int
                // so no RCTConvert calls are needed
                for (pipelineKey, pipelineValue) in value as! Dictionary<String, Int> {
                    switch pipelineKey {
                    case "profile":
                        builder = builder.useProfile(SpeechPipelineProfiles(rawValue: pipelineValue) ?? SpeechPipelineProfiles.pushToTalkAppleSpeech)
                        break
                    case "sampleRate":
                        speechConfig.sampleRate = pipelineValue
                        break
                    case "frameWidth":
                        speechConfig.frameWidth = pipelineValue
                        break
                    case "vadMode":
                        speechConfig.vadMode = VADMode(rawValue: pipelineValue) ?? VADMode.HighlyPermissive
                        break
                    case "vadFallDelay":
                        speechConfig.vadFallDelay = pipelineValue
                        break
                    default:
                        break
                    }
                }
                break
            default:
                break
            }
        }

        // Initialize TTS
        if #available(iOS 13, *) {
            synthesizer = TextToSpeech([self], configuration: speechConfig)
        } else {
            reject(
                "init_error",
                "Spokestack TTS is only available in iOS 13 or higher",
                RNSpokestackError.tts
            )
        }

        if nluFiles == 3 {
            do {
                try classifier = NLUTensorflow([self], configuration: speechConfig)
            } catch {
                handleError(error)
                reject("init_error", "Spokestack NLU initialization failed", error)
            }
        }

        // Build pipeline
        resolvers[RNSpokestackPromise.initialize] = resolve
        builder = builder.setConfiguration(speechConfig)
        builder = builder.addListener(self)
        do {
            try speechPipeline = builder.build()
        } catch {
            handleError(error)
            reject("init_error", "Speech Pipeline initialization failed", error)
        }
    }

    /// Start the speech pipeline
    @objc(start:withRejecter:)
    func start(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let pipeline = speechPipeline {
            resolvers[RNSpokestackPromise.start] = resolve
            rejecters[RNSpokestackPromise.start] = reject
            pipeline.start()
        }
    }

    /// Start the speech pipeline
    @objc(stop:withRejecter:)
    func stop(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let pipeline = speechPipeline {
            resolvers[RNSpokestackPromise.stop] = resolve
            rejecters[RNSpokestackPromise.stop] = reject
            pipeline.stop()
        }
    }

    /// Manually activate the speech pipeline
    @objc(activate:withRejecter:)
    func activate(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if !started {
            reject(
                "not_started",
                "Spokestack.start() must be called before Spokestack.activate()",
                RNSpokestackError.notStarted
            )
            return
        }
        if let pipeline = speechPipeline {
            resolvers[RNSpokestackPromise.activate] = resolve
            rejecters[RNSpokestackPromise.activate] = reject
            pipeline.activate()
        }
    }

    /// Manually deactivate the speech pipeline
    @objc(deactivate:withRejecter:)
    func deactivate(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let pipeline = speechPipeline {
            resolvers[RNSpokestackPromise.deactivate] = resolve
            rejecters[RNSpokestackPromise.deactivate] = reject
            pipeline.deactivate()
        } else {
            reject(
                "not_initialized",
                "The Speech Pipeline is not initialized. Call Spokestack.initialize().",
                RNSpokestackError.notInitialized
            )
        }
    }

    /// Synthesize text into speech
    /// - Parameters:
    ///   - input: String of text to synthesize into speech.
    ///   - format?: See the TTSFormat enum. One of text, ssml, or speech markdown.
    ///   - voice?: A string indicating the desired Spokestack voice. The default is the free voice: "demo-male".
    @objc(synthesize:withFormat:withVoice:withResolver:withRejecter:)
    func synthesize(input: String, format: Int, voice: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let tts = synthesizer {
            resolvers[RNSpokestackPromise.synthesize] = resolve
            rejecters[RNSpokestackPromise.synthesize] = reject
            let ttsInput = TextToSpeechInput(input, voice: voice, inputFormat: TTSInputFormat(rawValue: format) ?? TTSInputFormat.text)
            tts.synthesize(ttsInput)
        } else {
            reject(
                "not_initialized",
                "Spokestack TTS is not initialized. Call Spokestack.initialize().",
                RNSpokestackError.notInitialized
            )
        }
    }

    /// Convenience method for synthesizing text to speech and
    /// playing it immediately.
    /// Audio session handling can get very complex and we recommend
    /// using a RN library focused on audio for anything more than playing
    /// through the default audio system.
    @objc(speak:withFormat:withVoice:withResolver:withRejecter:)
    func speak(input: String, format: Int, voice: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let tts = synthesizer {
            resolvers[RNSpokestackPromise.speak] = resolve
            rejecters[RNSpokestackPromise.speak] = reject
            let ttsInput = TextToSpeechInput(input, voice: voice, inputFormat: TTSInputFormat(rawValue: format) ?? TTSInputFormat.text)
            tts.speak(ttsInput)
        } else {
            reject(
                "not_initialized",
                "Spokestack TTS is not initialized. Call Spokestack.initialize().",
                RNSpokestackError.notInitialized
            )
        }
    }

    /// Classfiy an utterance using NLUTensorflow
    /// - Parameters:
    ///   - utterance: String utterance from the user
    @objc(classify:withResolver:withRejecter:)
    func classify(utterance: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let nlu = classifier {
            resolvers[RNSpokestackPromise.classify] = resolve
            rejecters[RNSpokestackPromise.classify] = reject
            nlu.classify(utterance: utterance)
        } else {
            reject(
                "not_initialized",
                "Spokestack NLU is not initialized. Call Spokestack.initialize() with NLU file locations.",
                RNSpokestackError.notInitialized
            )
        }
    }
}
