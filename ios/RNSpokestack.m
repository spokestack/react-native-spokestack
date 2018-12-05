
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

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onSpeechRecognized", @"onSpeechStarted", @"onSpeechEnded", @"onSpeechError"];
}

- (void)didFinish {
    RCTLogInfo(@"speech ended");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechEnded" body:@{}];
    }
}

- (void)didRecognize:(SPSpeechContext * _Nonnull)results {
    RCTLogInfo(@"speech recognized as %@", results.transcript);
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechRecognized" body:@{@"transcript": @[results.transcript]}];
    }
}

- (void)didStart {
    RCTLogInfo(@"speech started");
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechStarted" body:@{}];
    }
}

- (void)didError:(NSString * _Nonnull)error {
    RCTLogInfo(@"speech error: %@", error);
    if (hasListeners)
    {
        [self sendEventWithName:@"onSpeechError" body:@{@"error": error}];
    }
}

SpeechPipeline* _pipeline;

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
    RCTLogInfo(@"Pretending to initialize with config %@", config);
    GoogleRecognizerConfiguration *_recognizerConfig = [[GoogleRecognizerConfiguration alloc] init];
    NSError *error;
    _recognizerConfig.apiKey = [RCTConvert NSString:[config valueForKeyPath:@"properties.google-api-key"]];
    NSLog(@"apiKey is %@", [RCTConvert NSString:[config valueForKeyPath:@"properties.google-api-key"]]);
    _pipeline = [[SpeechPipeline alloc] init:RecognizerServiceGoogle
                               configuration:_recognizerConfig
                                    delegate:self
                                       error:&error];
    if (error) {
        NSLog(@"Pretending the initialize error status is %@", error);
        [self didError:[error localizedDescription]];
    }
}

RCT_EXPORT_METHOD(start)
{
    RCTLogInfo(@"Pretending to start");
    [_pipeline start];
}

RCT_EXPORT_METHOD(stop)
{
    RCTLogInfo(@"Pretending to stop");
    [_pipeline stop];
}

@end
