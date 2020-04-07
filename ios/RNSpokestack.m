
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

/// MARK: SpeechEventListener implementation

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onSpeechEvent"];
}

- (void)activate {
    NSLog(@"RNSpokestack activate");
    [self.pipeline activate];
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"activate", @"transcript": @"", @"error": @""}];
    }
}

- (void)deactivate {
    NSLog(@"RNSpokestack deactivate");
    [self.pipeline deactivate];
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"deactivate", @"transcript": @"", @"error": @""}];
    }
}

- (void)didError:(NSError * _Nonnull)error {
    NSLog(@"RNSpokestack didError");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"error", @"transcript": @"", @"error": [error localizedDescription]}];
    }
}

- (void)didTrace:(NSString * _Nonnull)trace {
    NSLog(@"RNSpokestack didTrace");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"trace", @"transcript": @"", @"error": @"", @"trace": trace}];
    }
}

- (void)didStop {
    NSLog(@"RNSpokestack didStop");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"stop", @"transcript": @"", @"error": @""}];
    }
}

- (void)didStart {
    NSLog(@"RNSpokestack didStart");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"start", @"transcript": @"", @"error": @""}];
    }
}

- (void)didRecognize:(SpeechContext * _Nonnull)results {
    NSLog(@"RNSpokestack didRecognize");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"recognize", @"transcript": results.transcript, @"error": @""}];
    }
}

/// MARK: PipelineDelegate implementation

- (void)didTimeout {
    NSLog(@"RNSpokestack didTimeout");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"timeout", @"transcript": @"", @"error": @""}];
    }
}

- (void)setupFailed:(NSString * _Nonnull)error {
    NSLog(@"RNSpokestack setupFailed");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"error", @"transcript": @"", @"error": error}];
    }
}

- (void)didInit {
    NSLog(@"RNSpokestack didInit");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"init", @"transcript": @"", @"error": @""}];
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

    NSError *error;
        
    // Tracing

    self.speechConfig.tracing = ([config valueForKeyPath:@"properties.trace-level"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.trace-level"]] : self.speechConfig.tracing;
    
    // Speech

    self.asrService = [AppleSpeechRecognizer sharedInstance];
    self.speechConfig.vadFallDelay = ([config valueForKeyPath:@"properties.vad-fall-delay"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.vad-fall-delay"]] : self.speechConfig.vadFallDelay;

    // Wakeword signal processing
    
    self.speechConfig.rmsTarget = ([config valueForKeyPath:@"properties.rms-target"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"properties.rms-target"]] floatValue] : self.speechConfig.rmsTarget;
    self.speechConfig.rmsAlpha = ([config valueForKeyPath:@"properties.rms-alpha"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"properties.rms-alpha"]] floatValue] : self.speechConfig.rmsAlpha;
    self.speechConfig.fftWindowSize = ([config valueForKeyPath:@"properties.fft-window-size"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.fft-window-size"]] : self.speechConfig.fftWindowSize;
    self.speechConfig.fftHopLength = ([config valueForKeyPath:@"properties.fft-hop-length"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.fft-hop-length"]] : self.speechConfig.fftHopLength;
    self.speechConfig.melFrameLength = ([config valueForKeyPath:@"properties.mel-frame-length"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.mel-frame-length"]] : self.speechConfig.melFrameLength;
    self.speechConfig.melFrameWidth = ([config valueForKeyPath:@"properties.mel-frame-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.mel-frame-width"]] : self.speechConfig.melFrameWidth;
    self.speechConfig.stateWidth = ([config valueForKeyPath:@"properties.state-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.state-width"]] : self.speechConfig.stateWidth;
    self.speechConfig.encodeLength = ([config valueForKeyPath:@"properties.wake-encode-length"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.wake-encode-length"]] : self.speechConfig.encodeLength;
    self.speechConfig.encodeWidth = ([config valueForKeyPath:@"properties.wake-encode-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.wake-encode-width"]] : self.speechConfig.encodeWidth;
    self.speechConfig.wakeActiveMin = ([config valueForKeyPath:@"properties.wake-active-min"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.wake-active-min"]] : self.speechConfig.wakeActiveMin;
    self.speechConfig.wakeActiveMax = ([config valueForKeyPath:@"properties.wake-active-max"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.wake-active-max"]] : self.speechConfig.wakeActiveMax;
    self.speechConfig.frameWidth = ([config valueForKeyPath:@"properties.frame-width"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.frame-width"]] : self.speechConfig.frameWidth;
    self.speechConfig.preEmphasis = ([config valueForKeyPath:@"properties.pre-emphasis"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"properties.pre-emphasis"]] floatValue] : self.speechConfig.preEmphasis;

    // Wakeword models
    
    // TFLite
    if ([[config valueForKey:@"stages"] containsObject:@"com.pylon.spokestack.wakeword.WakewordTrigger"]) {
        self.wakewordService = [TFLiteWakewordRecognizer sharedInstance];
        self.speechConfig.filterModelPath = ([config valueForKeyPath:@"properties.wake-filter-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-filter-path"]] : self.speechConfig.filterModelPath;
        self.speechConfig.encodeModelPath = ([config valueForKeyPath:@"properties.wake-encode-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-encode-path"]] : self.speechConfig.encodeModelPath;
        self.speechConfig.detectModelPath = ([config valueForKeyPath:@"properties.wake-detect-path"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-detect-path"]] : self.speechConfig.detectModelPath;
        self.speechConfig.wakeThreshold = ([config valueForKeyPath:@"properties.wake-threshold"]) ? [[RCTConvert NSNumber:[config valueForKeyPath:@"properties.wake-threshold"]] floatValue] : self.speechConfig.wakeThreshold;
    // Apple ASR
    } else {
        self.wakewordService = [AppleWakewordRecognizer sharedInstance];
        self.speechConfig.wakePhrases = ([config valueForKeyPath:@"properties.wake-phrases"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-phrases"]] : self.speechConfig.wakePhrases;
        self.speechConfig.wakewordRequestTimeout = ([config valueForKeyPath:@"properties.wake-request-timeout"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.wake-request-timeout"]] : self.speechConfig.wakewordRequestTimeout;
    }

    self.pipeline = [[SpeechPipeline alloc] init: self.asrService
                         speechConfiguration: self.speechConfig
                              speechDelegate: self
                             wakewordService: self.wakewordService
                            pipelineDelegate: self];
    if (error) {
        NSLog(@"RNSpokestack initialize error: %@", error);
        [self didError: error];
    }
}

RCT_EXPORT_METHOD(start)
{
    if (![self.pipeline status]) {
        NSLog(@"RNSpokestack start status was false");
        [self.pipeline setDelegates: self pipelineDelegate: self];
    }
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
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"activate", @"transcript": @"", @"error": @""}];
    }
}

RCT_REMAP_METHOD(deactivate, makeDeactive)
{
    NSLog(@"RNSpokestack deactivate()");
    [self.pipeline deactivate];
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"deactivate", @"transcript": @"", @"error": @""}];
    }
}

@end
