import Spokestack

enum RNSpokestackError: Error {
    case notInitialized
    case notStarted
    case builderNotAvailable
    case downloaderNotAvailable
}

extension RNSpokestackError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return NSLocalizedString("Spokestack has not yet been initialized. Call Spokestack.initialize()", comment: "")
        case .notStarted:
            return NSLocalizedString("Spokestack has not yet been started. Call Spokestack.start() before calling Spokestack.activate().", comment: "")
        case .builderNotAvailable:
            return NSLocalizedString("buildPipeline() was called somehow without first initializing a builder", comment: "")
        case .downloaderNotAvailable:
            return NSLocalizedString("Models were passed to initialize that could not be downloaded. The downloader was not initialized properly.", comment: "")
        }
    }
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
    var speechPipelineBuilder: SpeechPipelineBuilder?
    var speechPipeline: SpeechPipeline?
    var speechConfig: SpeechConfiguration = SpeechConfiguration()
    var speechContext: SpeechContext?
    var synthesizer: TextToSpeech?
    var classifier: NLUTensorflow?
    var started = false
    var resolvers: [RNSpokestackPromise:RCTPromiseResolveBlock] = [:]
    var rejecters: [RNSpokestackPromise:RCTPromiseRejectBlock] = [:]
    var makeClassifer = false
    var downloader: Downloader?
    var numRequests = 0

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
    
    func notInitialized(_ reject: RCTPromiseRejectBlock, module: String) {
        reject(
            "not_initialized",
            "\(module) is not initialized. Call Spokestack.initialize() first.",
            RNSpokestackError.notInitialized
        )
    }

    func didTrace(_ trace: String) {
        sendEvent(withName: "trace", body: [ "message": trace ])
    }

    func didInit() {
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

    func makeCompleteForModelDownload(speechProp: String) -> (Error?, String?) -> Void {
        return { (error: Error?, fileUrl: String?) -> Void in
            self.numRequests -= 1
            if (error != nil) {
                self.failure(error: error!)
            } else {
                // Set local model filepath on speech config
                self.speechConfig.setValue(fileUrl, forKey: speechProp)

                // Build the pipeline if there are no more requests
                if self.numRequests <= 0 {
                    self.buildPipeline()
                }
            }
        }
    }

    func buildPipeline() {
        if speechPipeline != nil {
            return
        }
        if makeClassifer {
            do {
                try classifier = NLUTensorflow([self], configuration: speechConfig)
            } catch {
                failure(error: error)
                return
            }
        }
        if var builder = speechPipelineBuilder {
            builder = builder.setConfiguration(speechConfig)
            builder = builder.addListener(self)
            do {
                try speechPipeline = builder.build()
            } catch {
                failure(error: error)
            }
        } else {
            failure(error: RNSpokestackError.builderNotAvailable)
        }
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
        downloader = Downloader(allowCellular: RCTConvert.bool(config?["allowCellular"]), refreshModels: RCTConvert.bool(config?["refreshModels"]))
        speechContext = SpeechContext(speechConfig)
        speechConfig.apiId = clientId
        speechConfig.apiSecret = clientSecret
        speechPipelineBuilder = SpeechPipelineBuilder()
        speechPipelineBuilder = speechPipelineBuilder?.useProfile(SpeechPipelineProfiles.pushToTalkAppleSpeech)
        var nluDownloads: [URL:(Error?, String?) -> Void] = [:]
        var wakeDownloads: [URL:(Error?, String?) -> Void] = [:]
        for (key, value) in config! {
            switch key {
            case "traceLevel":
                speechConfig.tracing = Trace.Level(rawValue: RCTConvert.nsInteger(value)) ?? Trace.Level.NONE
                break
            case "nlu":
                // All values in pipeline are Strings
                // so no RCTConvert calls are needed
                for (nluKey, nluValue) in value as! Dictionary<String, String> {
                    switch nluKey {
                    case "model":
                        nluDownloads[RCTConvert.nsurl(nluValue)] = makeCompleteForModelDownload(speechProp: "nluModelPath")
                        break
                    case "metadata":
                        nluDownloads[RCTConvert.nsurl(nluValue)] = makeCompleteForModelDownload(speechProp: "nluModelMetadataPath")
                        break
                    case "vocab":
                        nluDownloads[RCTConvert.nsurl(nluValue)] = makeCompleteForModelDownload(speechProp: "nluVocabularyPath")
                        break
                    default:
                        break
                    }
                }
            case "wakeword":
                for (wakeKey, wakeValue) in value as! Dictionary<String, Any> {
                    switch wakeKey {
                    case "filter":
                        wakeDownloads[RCTConvert.nsurl(wakeValue)] = makeCompleteForModelDownload(speechProp: "filterModelPath")
                        break
                    case "detect":
                        wakeDownloads[RCTConvert.nsurl(wakeValue)] = makeCompleteForModelDownload(speechProp: "detectModelPath")
                        break
                    case "encode":
                        wakeDownloads[RCTConvert.nsurl(wakeValue)] = makeCompleteForModelDownload(speechProp: "encodeModelPath")
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
                        speechPipelineBuilder = speechPipelineBuilder?.useProfile(SpeechPipelineProfiles(rawValue: pipelineValue) ?? SpeechPipelineProfiles.pushToTalkAppleSpeech)
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
        synthesizer = TextToSpeech([self], configuration: speechConfig)

        // Download model files if necessary
        if let d = downloader {
            // Set resolve now in case
            // all downloads are synchronous, early returns
            // from the cache and the last one builds the pipeline
            resolvers[RNSpokestackPromise.initialize] = resolve
            rejecters[RNSpokestackPromise.initialize] = reject

            // Set to total before starting requests
            // in case the downloader returns the cached version synchronously.
            // This avoids wakeword building the pipeline before moving on to NLU
            numRequests = (wakeDownloads.count == 3 ? 3 : 0) + (nluDownloads.count == 3 ? 3 : 0)

            if wakeDownloads.count == 3 {
                wakeDownloads.forEach { (url, complete) in
                    d.downloadModel(url, complete)
                }
            }
            if nluDownloads.count == 3 {
                makeClassifer = true
                nluDownloads.forEach { (url, complete) in
                    d.downloadModel(url, complete)
                }
            }
        } else {
            reject("init_error", "The downloader is unexpectedly nil.", RNSpokestackError.downloaderNotAvailable)
        }

        if numRequests == 0 {
            buildPipeline()
        }
    }

    /// Start the speech pipeline
    @objc(start:withRejecter:)
    func start(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let pipeline = speechPipeline {
            resolvers[RNSpokestackPromise.start] = resolve
            rejecters[RNSpokestackPromise.start] = reject
            pipeline.start()
        } else {
            notInitialized(reject, module: "Speech Pipeline")
        }
    }

    /// Start the speech pipeline
    @objc(stop:withRejecter:)
    func stop(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let pipeline = speechPipeline {
            resolvers[RNSpokestackPromise.stop] = resolve
            rejecters[RNSpokestackPromise.stop] = reject
            pipeline.stop()
        } else {
            notInitialized(reject, module: "Speech Pipeline")
        }
    }

    /// Manually activate the speech pipeline
    @objc(activate:withRejecter:)
    func activate(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        if let pipeline = speechPipeline {
            if !started {
                reject(
                    "not_started",
                    "Spokestack.start() must be called before Spokestack.activate()",
                    RNSpokestackError.notStarted
                )
                return
            }
            resolvers[RNSpokestackPromise.activate] = resolve
            rejecters[RNSpokestackPromise.activate] = reject
            pipeline.activate()
        } else {
            notInitialized(reject, module: "Speech Pipeline")
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
            notInitialized(reject, module: "Speech Pipeline")
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
            notInitialized(reject, module: "Spokestack TTS")
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
            notInitialized(reject, module: "Spokestack TTS")
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
            notInitialized(reject, module: "Spokestack NLU")
        }
    }
}
