
#import "RNSpokestack.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <SpokeStack/SpokeStack-Swift.h>

@implementation RNSpokestack
{
    bool hasListeners;
}

RCT_EXPORT_MODULE(Spokestack);

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

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"recognize", @"activate", @"deactivate", @"error", @"start", @"finish"];
}

- (void)deactivate {
    if (hasListeners)
    {
        [self sendEventWithName:@"deactivate" body:@{}];
    }
}

- (void)didRecognize:(SpeechContext * _Nonnull)results {
    if (hasListeners)
    {
        [self sendEventWithName:@"recognize" body:@{@"transcript": @[results.transcript]}];
    }
}

- (void)activate {
    if (hasListeners)
    {
        [self sendEventWithName:@"activate" body:@{}];
    }
}

- (void)didError:(NSString * _Nonnull)error {
    if (hasListeners)
    {
        [self sendEventWithName:@"error" body:@{@"error": error}];
    }
}

- (void)didStart {
    if (hasListeners)
    {
        [self sendEventWithName:@"start" body:@{}];
    }
}

- (void)didFinish {
    if (hasListeners)
    {
        [self sendEventWithName:@"finish" body:@{}];
    }
}

SpeechPipeline* _pipeline;

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
        [self didError:[error localizedDescription]];
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

//RCT_EXPORT_METHOD(activate)
//{
//  [_pipeline activate];
//}
//
//RCT_EXPORT_METHOD(deactivate)
//{
//  [_pipeline deactivate];
//}

@end
