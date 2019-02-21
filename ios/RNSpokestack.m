
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

- (void)deactivate {
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"deactivate", @"transcript": @[], @"error": @""}];
    }
}

- (void)didRecognize:(SpeechContext * _Nonnull)results {
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"recognize", @"transcript": @[results.transcript], @"error": @""}];
    }
    [_pipeline start];
}

- (void)activate {
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"activate", @"transcript": @[], @"error": @""}];
    }
    [_pipeline activate];
}

- (void)didError:(NSError * _Nonnull)error {
    /*
     A `Error Domain=kAFAssistantErrorDomain Code=216 "(null)"` (although sometimes it’s a `209` instead of `216`) is an error on Apple's service side that should be ignored. For discussion sees https://stackoverflow.com/questions/53037789/sfspeechrecognizer-216-error-with-multiple-requests?noredirect=1&lq=1
     */
    if (!([[error localizedDescription] hasPrefix: @"The operation couldn’t be completed. (kAFAssistantErrorDomain error 216.)"]
          || [[error localizedDescription] hasPrefix: @"The operation couldn’t be completed. (kAFAssistantErrorDomain error 209.)"])
        && hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"error", @"transcript": @[], @"error": [error localizedDescription]}];
    }
}

- (void)didStart {
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"start", @"transcript": @[], @"error": @""}];
    }
}

- (void)didFinish {
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEvent" body:@{@"event": @"stop", @"transcript": @[], @"error": @""}];
    }
}

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
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

    // Wakeword

    if ([[config valueForKey:@"stages"] containsObject:@"com.pylon.spokestack.wakeword.WakewordTrigger"]) {
        _wakewordService = WakewordServiceAppleWakeword; // for now, override WakewordServiceModelWakeword
    } else {
        _wakewordService = WakewordServiceAppleWakeword;
    }

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
    [_pipeline start];
}

RCT_EXPORT_METHOD(stop)
{
    [_pipeline stop];
}

RCT_REMAP_METHOD(activate, makeActive)
{
  [_pipeline activate];
}

RCT_REMAP_METHOD(deactivate, makeDeactive)
{
  [_pipeline deactivate];
}

@end
