
#import "RNSpokestack.h"
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
    return @[@"onSpeechRecognized", @"onSpeechStarted", @"onSpeechEnded"];
}

SpeechPipeline* _pipeline;

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
    RCTLogInfo(@"Pretending to initialize with config %@", config);
    GoogleRecognizerConfiguration *_recognizerConfig = [[GoogleRecognizerConfiguration alloc] init];
    _recognizerConfig.host = config[@"host"];
    _recognizerConfig.enableWordTimeOffsets = config[@"enableWordTimeOffsets"];
    _recognizerConfig.singleUtterance = config[@"singleUtterance"];
    _recognizerConfig.maxAlternatives = config[@"maxAlternatives"];
    _recognizerConfig.interimResults = config[@"interimResults"];
    _recognizerConfig.apiKey = config[@"apiKey"];
    _pipeline = [[SpeechPipeline alloc] init:RecognizerServiceGoogle
                               configuration:_recognizerConfig
                                    delegate:self
                                       error:nil];
}

RCT_EXPORT_METHOD(start:(NSString*)foo)
{
    RCTLogInfo(@"Pretending to start");
    [_pipeline start];
}

RCT_EXPORT_METHOD(stop)
{
    RCTLogInfo(@"Pretending to stop");
    [_pipeline stop];
}

- (void)didFinish {
    RCTLogInfo(@"Pretending speech finished");
    if (hasListeners)
    {
        //[self sendEventWithName:@"onSpeechEnded"];
    }
}

- (void)didRecognize:(SPSpeechContext * _Nonnull)results {
    RCTLogInfo(@"Pretending speech recognized as %@", results.transcript);
    if (hasListeners)
    {
        //[self sendEventWithName:@"onSpeechRecognized" body:@{@"transcript": result.transcript}];
        
    }
}

- (void)didStart {
    RCTLogInfo(@"Pretending speech started");
    if (hasListeners)
    {
        //[self sendEventWithName:@"onSpeechStarted"];
    }
}

@end
