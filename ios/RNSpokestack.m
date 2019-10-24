
#import "RNSpokestack.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <SpokeStack/SpokeStack-Swift.h>

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
    if (self.pipeline != nil) {
        return;
    }
    self.speechConfig = [[SpeechConfiguration alloc] init];

    NSError *error;

    // Speech

    self.asrService = [AppleSpeechRecognizer sharedInstance];
    self.speechConfig.vadFallDelay = ([config valueForKeyPath:@"properties.vad-fall-delay"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.vad-fall-delay"]] : self.speechConfig.vadFallDelay;

    // Wakeword
    
    if ([[config valueForKey:@"stages"] containsObject:@"com.pylon.spokestack.wakeword.WakewordTrigger"]) {
        self.wakewordService = [AppleWakewordRecognizer sharedInstance]; // for now, override WakewordServiceModelWakeword
    } else {
        self.wakewordService = [AppleWakewordRecognizer sharedInstance];
    }
    self.speechConfig.wakePhrases = ([config valueForKeyPath:@"properties.wake-phrases"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-phrases"]] : self.speechConfig.wakePhrases;
    self.speechConfig.wakeWords = ([config valueForKeyPath:@"properties.wake-words"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-words"]] : self.speechConfig.wakeWords;

    self.pipeline = [[SpeechPipeline alloc] init: self.asrService
                         speechConfiguration: self.speechConfig
                              speechDelegate: self
                             wakewordService: self.wakewordService
                            wakewordDelegate: self
                            pipelineDelegate: self
                                       error: &error];
    if (error) {
        [self didError: error];
    }
}

RCT_EXPORT_METHOD(start)
{
    if (![self.pipeline status]) {
        NSLog(@"RNSpokestack start status was false");
        [self.pipeline setDelegates: self wakewordDelegate: self];
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
