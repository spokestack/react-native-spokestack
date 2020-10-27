
#import "RNSpokestack.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <Spokestack/Spokestack-Swift.h>

@implementation RNSpokestack
{
    bool hasListeners;
}

/// MARK: RCTBridgeModule implementation

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

/// MARK: RCTEventEmitter implementation

-(void)startObserving
{
    hasListeners = YES;
}
-(void)stopObserving
{
    hasListeners = NO;
}

/// MARK: SpokestackDelegate implementation

- (void)failureWithError:(NSError * _Nonnull)error {
    NSLog(@"RNSpokestack failureWithError");
    if (hasListeners)
    {
        [self sendEventWithName:@"onErrorEvent" body:@{
            @"event": @"error", @"error": [error localizedDescription]}];
    }
}

/// MARK: Pipeline

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onSpeechEvent", @"onTTSEvent", @"onNLUEvent", @"onErrorEvent"];
}

- (void)didActivate {
    NSLog(@"RNSpokestack activate");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"activate", @"transcript": @"", @"error": @""}];
    }
}

- (void)didDeactivate {
    NSLog(@"RNSpokestack deactivate");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"deactivate", @"transcript": @"", @"error": @""}];
    }
}

- (void)didTrace:(NSString * _Nonnull)trace {
    NSLog(@"RNSpokestack didTrace");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"trace", @"transcript": @"", @"error": @"", @"trace": trace}];
    }
}

- (void)didStop {
    NSLog(@"RNSpokestack didStop");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"stop", @"transcript": @"", @"error": @""}];
    }
}

- (void)didStart {
    NSLog(@"RNSpokestack didStart");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"start", @"transcript": @"", @"error": @""}];
    }
}

- (void)didRecognize:(SpeechContext * _Nonnull)results {
    NSLog(@"RNSpokestack didRecognize");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"recognize", @"transcript": results.transcript, @"error": @""}];
    }
}

- (void)didTimeout {
    NSLog(@"RNSpokestack didTimeout");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"timeout", @"transcript": @"", @"error": @""}];
    }
}

- (void)setupFailed:(NSString * _Nonnull)error {
    NSLog(@"RNSpokestack setupFailed");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"error", @"transcript": @"", @"error": error}];
    }
}

- (void)didInit {
    NSLog(@"RNSpokestack didInit");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{
            @"event": @"init", @"transcript": @"", @"error": @""}];
    }
}

/// MARK: TTS

- (void)didBeginSpeaking {
    NSLog(@"RNSpokestack didBeginSpeaking");
    // this event is not implemented in JavaScript
}

- (void)didFinishSpeaking {
    NSLog(@"RNSpokestack didFinishSpeaking");
    // this event is not implemented in JavaScript
}

- (void)successWithResult:(TextToSpeechResult * _Nonnull)result {
    NSLog(@"RNSpokestack successWithResult");
    if (hasListeners)
    {
        [self sendEventWithName:@"onTTSEvent" body:@{
            @"event": @"success", @"url": result.url.absoluteString, @"error": @""}];
    }
}

/// MARK: NLU

- (void)classificationWithResult:(NLUResult * _Nonnull)result {
    NSLog(@"RNSpokestack classificationWithResult");
    if (hasListeners)
    {
        // convert the typed slot dictionary into a simple dictionary of string keys and values
        NSMutableDictionary *slots = [[NSMutableDictionary alloc] init];
        [result.slots enumerateKeysAndObjectsUsingBlock:^(NSString *name, Slot *slot, BOOL *stop) {
            slots[name] = @{@"type": slot.type, @"value": (slot.value ?: [NSNull null]), @"rawValue": (slot.rawValue  ?: [NSNull null])};
        }];
        // send the slots along with the rest of the result object
        [self sendEventWithName:@"onNLUEvent" body: @{@"event": @"classification", @"result": @{@"intent":result.intent, @"confidence":[[NSNumber numberWithFloat:result.confidence] stringValue], @"slots":slots}, @"error":@""}];
    }
}

/// MARK: Exported Methods

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
    NSLog(@"RNSpokestack initialize");
    if (self.pipeline != nil) {
        return;
    }
    self.speechConfig = [[SpeechConfiguration alloc] init];
    self.speechContext = [[SpeechContext alloc] init: self.speechConfig];

    NSError *error;

    /// MARK: Speech

    self.speechConfig.vadFallDelay = ([config valueForKeyPath:@"pipeline.vad-fall-delay"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.vad-fall-delay"]] : self.speechConfig.vadFallDelay;
    
    /// MARK: Wakeword

    self.speechConfig.rmsTarget = ([config valueForKeyPath:@"pipeline.rms-target"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"pipeline.rms-target"]] floatValue] : self.speechConfig.rmsTarget;
    self.speechConfig.rmsAlpha = ([config valueForKeyPath:@"pipeline.rms-alpha"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"pipeline.rms-alpha"]] floatValue] : self.speechConfig.rmsAlpha;
    self.speechConfig.fftWindowSize = ([config valueForKeyPath:@"pipeline.fft-window-size"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.fft-window-size"]] : self.speechConfig.fftWindowSize;
    self.speechConfig.fftHopLength = ([config valueForKeyPath:@"pipeline.fft-hop-length"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.fft-hop-length"]] : self.speechConfig.fftHopLength;
    self.speechConfig.melFrameLength = ([config valueForKeyPath:@"pipeline.mel-frame-length"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.mel-frame-length"]] : self.speechConfig.melFrameLength;
    self.speechConfig.melFrameWidth = ([config valueForKeyPath:@"pipeline.mel-frame-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.mel-frame-width"]] : self.speechConfig.melFrameWidth;
    self.speechConfig.stateWidth = ([config valueForKeyPath:@"pipeline.state-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.state-width"]] : self.speechConfig.stateWidth;
    self.speechConfig.encodeLength = ([config valueForKeyPath:@"pipeline.wake-encode-length"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.wake-encode-length"]] : self.speechConfig.encodeLength;
    self.speechConfig.encodeWidth = ([config valueForKeyPath:@"pipeline.wake-encode-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.wake-encode-width"]] : self.speechConfig.encodeWidth;
    self.speechConfig.wakeActiveMin = ([config valueForKeyPath:@"pipeline.wake-active-min"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.wake-active-min"]] : self.speechConfig.wakeActiveMin;
    self.speechConfig.wakeActiveMax = ([config valueForKeyPath:@"pipeline.wake-active-max"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.wake-active-max"]] : self.speechConfig.wakeActiveMax;
    self.speechConfig.frameWidth = ([config valueForKeyPath:@"pipeline.frame-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.frame-width"]] : self.speechConfig.frameWidth;
    self.speechConfig.preEmphasis = ([config valueForKeyPath:@"pipeline.pre-emphasis"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"pipeline.pre-emphasis"]] floatValue] : self.speechConfig.preEmphasis;
    self.speechConfig.filterModelPath = ([config valueForKeyPath:@"pipeline.wake-filter-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"pipeline.wake-filter-path"]] : self.speechConfig.filterModelPath;
    self.speechConfig.encodeModelPath = ([config valueForKeyPath:@"pipeline.wake-encode-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"pipeline.wake-encode-path"]] : self.speechConfig.encodeModelPath;
    self.speechConfig.detectModelPath = ([config valueForKeyPath:@"pipeline.wake-detect-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"pipeline.wake-detect-path"]] : self.speechConfig.detectModelPath;
    self.speechConfig.wakeThreshold = ([config valueForKeyPath:@"pipeline.wake-threshold"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"pipeline.wake-threshold"]] floatValue] : self.speechConfig.wakeThreshold;
    self.speechConfig.wakewords = ([config valueForKeyPath:@"properties.wakewords"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wakewords"]] : self.speechConfig.wakewords;
    self.speechConfig.wakewordRequestTimeout = ([config valueForKeyPath:@"properties.wake-request-timeout"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.wake-request-timeout"]] : self.speechConfig.wakewordRequestTimeout;

    /// MARK: Spokestack configuration

    self.speechConfig.tracing = ([config valueForKeyPath:@"properties.trace-level"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.trace-level"]] : self.speechConfig.tracing;
    self.speechConfig.apiId = ([config valueForKeyPath:@"properties.api-id"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.api-id"]] : self.speechConfig.apiId;
    self.speechConfig.apiSecret = ([config valueForKeyPath:@"properties.api-secret"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.api-secret"]] : self.speechConfig.apiSecret;

    /// MARK: NLU

    self.speechConfig.nluModelPath = ([config valueForKeyPath:@"nlu.nlu-model-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"nlu.nlu-model-path"]] : self.speechConfig.nluModelPath;
    self.speechConfig.nluModelMetadataPath = ([config valueForKeyPath:@"nlu.nlu-metadata-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"nlu.nlu-metadata-path"]] : self.speechConfig.nluModelMetadataPath;
    self.speechConfig.nluVocabularyPath = ([config valueForKeyPath:@"nlu.wordpiece-vocab-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"nlu.wordpiece-vocab-path"]] : self.speechConfig.nluVocabularyPath;

    /// MARK: Pipeline, NLU, & TTS init

    NSArray *listeners = @[self];
    
    self.nlu = [[NLUTensorflow alloc] init:listeners configuration:self.speechConfig error:&error];
    if (error) {
        NSLog(@"RNSpokestack initialize error: %@", error);
        [self failureWithError: error];
    }

    SpeechPipelineBuilder *pipelineBuilder = [[SpeechPipelineBuilder alloc] init];
    pipelineBuilder = [pipelineBuilder setConfiguration:self.speechConfig];
    pipelineBuilder = [pipelineBuilder addListener: self];
    pipelineBuilder = [pipelineBuilder useProfile: ([config valueForKeyPath:@"pipeline.profile"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"pipeline.profile"]] : 1];
    self.pipeline = [pipelineBuilder buildAndReturnError: &error];
    if (error) {
        NSLog(@"RNSpokestack initialize error: %@", error);
        [self failureWithError: error];
    }

    if (@available(iOS 13.0, *)) {
        self.tts = [[TextToSpeech alloc] init:listeners configuration:self.speechConfig];
    } else {
        NSLog(@"RNSpokestack initialize error: %@", @"Spokestack TTS is only available in iOS 13 or higher.");
        [self failureWithError: error];
    }
}

RCT_EXPORT_METHOD(start)
{
    [self.pipeline start];
}

RCT_EXPORT_METHOD(stop)
{
    [self.pipeline stop];
}

RCT_REMAP_METHOD(activate, makeActive)
{
    NSLog(@"RNSpokestack activate()");
    [self.pipeline activate];
}

RCT_REMAP_METHOD(deactivate, makeDeactive)
{
    NSLog(@"RNSpokestack deactivate()");
    [self.pipeline deactivate];
}

RCT_EXPORT_METHOD(synthesize:(NSDictionary *) ttsInput)
{
    NSLog(@"RNSpokestack synthesize()");
    TTSInputFormat format = ([ttsInput valueForKeyPath:@"format"]) ? [RCTConvert NSInteger:[ttsInput valueForKeyPath:@"format"]] : 0;
    format = format? format: TTSInputFormatText;
    TextToSpeechInput *input = [[TextToSpeechInput alloc] init:ttsInput[@"input"] voice:ttsInput[@"voice"] inputFormat:format id:ttsInput[@"id"]];
    [self.tts synthesize: input];
}

RCT_EXPORT_METHOD(classify:(NSString *) utterance withContext:(NSDictionary *) context)
{
    NSLog(@"RNSpokestack classify()");
    [self.nlu classifyWithUtterance:utterance context:context];
}

@end
