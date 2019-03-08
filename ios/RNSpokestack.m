
#import "RNSpokestack.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <SpokeStack/SpokeStack-Swift.h>

@implementation RNSpokestack
{
    bool hasListeners;
}

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

-(void)startObserving
{
    hasListeners = YES;
}
-(void)stopObserving
{
    hasListeners = NO;
}

SpeechPipeline* _pipeline;

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onSpeechEvent"];
}

- (void)timeout {
    NSLog(@"RNSpokestack timeout");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"timeout", @"transcript": @"", @"error": @""}];
    }
}

- (void)deactivate {
    NSLog(@"RNSpokestack deactivate");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"deactivate", @"transcript": @"", @"error": @""}];
    }
    [_pipeline deactivate];
}

- (void)didRecognize:(SpeechContext * _Nonnull)results {
    NSLog(@"RNSpokestack didRecognize");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"recognize", @"transcript": results.transcript, @"error": @""}];
    }
}

- (void)activate {
    NSLog(@"RNSpokestack activate");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"activate", @"transcript": @"", @"error": @""}];
    }
    [_pipeline activate];
}

- (void)didError:(NSError * _Nonnull)error {
    NSLog(@"RNSpokestack didError");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"error", @"transcript": @"", @"error": [error localizedDescription]}];
    }
}

- (void)didStart {
    NSLog(@"RNSpokestack didStart");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"start", @"transcript": @"", @"error": @""}];
    }
}

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
    if (_pipeline != nil) {
        return;
    }
    RecognizerService _recognizerService;
    RecognizerConfiguration *_recognizerConfig;
    WakewordService _wakewordService;
    WakewordConfiguration *_wakewordConfig = [[WakewordConfiguration alloc] init];

    NSError *error;

    // Speech

    if ([[config valueForKey:@"stages"] containsObject:@"com.pylon.spokestack.google.GoogleSpeechRecognizer"]) { // For now, override RecognizerServiceGoogleSpeech;
        _recognizerConfig = [[RecognizerConfiguration alloc] init]; //[[GoogleRecognizerConfiguration alloc] init];
        // _recognizerConfig.apiKey = [RCTConvert NSString:[config valueForKeyPath:@"properties.google-api-key"]];
        _recognizerService = RecognizerServiceAppleSpeech; // RecognizerServiceGoogleSpeech;
    } else {
        _recognizerConfig = [[RecognizerConfiguration alloc] init];
        _recognizerService = RecognizerServiceAppleSpeech;
    }
    _recognizerConfig.vadFallDelay = ([config valueForKeyPath:@"properties.vad-fall-delay"]) ? [RCTConvert NSInteger:[config valueForKeyPath:@"properties.vad-fall-delay"]] : _recognizerConfig.vadFallDelay;

    // Wakeword

    if ([[config valueForKey:@"stages"] containsObject:@"com.pylon.spokestack.wakeword.WakewordTrigger"]) {
        _wakewordService = WakewordServiceAppleWakeword; // for now, override WakewordServiceModelWakeword
    } else {
        _wakewordService = WakewordServiceAppleWakeword;
    }
    _wakewordConfig.wakePhrases = ([config valueForKeyPath:@"properties.wake-phrases"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-phrases"]] : _wakewordConfig.wakePhrases;
    _wakewordConfig.wakeWords = ([config valueForKeyPath:@"properties.wake-words"]) ? [RCTConvert NSString:[config valueForKeyPath:@"properties.wake-words"]] : _wakewordConfig.wakeWords;

    _pipeline = [[SpeechPipeline alloc] init: _recognizerService
                         speechConfiguration: _recognizerConfig
                              speechDelegate: self
                             wakewordService: _wakewordService
                       wakewordConfiguration: _wakewordConfig
                            wakewordDelegate: self
                                       error: &error];
    if (error) {
        [self didError: error];
    }
}

RCT_EXPORT_METHOD(start)
{
    if (![_pipeline status]) {
        NSLog(@"RNSpokestack start status was false");
        [_pipeline setDelegates: self wakewordDelegate: self];
    }
    [_pipeline start];
}

RCT_EXPORT_METHOD(stop)
{
    [_pipeline stop];
}

RCT_REMAP_METHOD(activate, makeActive)
{
    NSLog(@"RNSpokestack activate()");
    [_pipeline activate];
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"activate", @"transcript": @"", @"error": @""}];
    }
}

RCT_REMAP_METHOD(deactivate, makeDeactive)
{
    NSLog(@"RNSpokestack deactivate()");
    [_pipeline deactivate];
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"deactivate", @"transcript": @"", @"error": @""}];
    }
}

@end
