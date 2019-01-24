
#import "RNSpokestack.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <SpokeStack/SpokeStack.h>

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
    return @[@"onRecognize", @"onActivate", @"onDeactivate", @"onError"];
}

- (void)didFinish {
    if (hasListeners)
    {
        [self sendEventWithName:@"onDeactivate" body:@{}];
    }
}

- (void)didRecognize:(SPSpeechContext * _Nonnull)results {
    if (hasListeners)
    {
        [self sendEventWithName:@"onRecognize" body:@{@"transcript": @[results.transcript]}];
    }
}

- (void)didStart {
    if (hasListeners)
    {
        [self sendEventWithName:@"onActivate" body:@{}];
    }
}

- (void)didError:(NSString * _Nonnull)error {
    if (hasListeners)
    {
        [self sendEventWithName:@"onError" body:@{@"error": error}];
    }
}

SpeechPipeline* _pipeline;

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
    GoogleRecognizerConfiguration *_recognizerConfig = [[GoogleRecognizerConfiguration alloc] init];
    NSError *error;
    _recognizerConfig.apiKey = [RCTConvert NSString:[config valueForKeyPath:@"properties.google-api-key"]];
    _pipeline = [[SpeechPipeline alloc] init:RecognizerServiceGoogle
                               configuration:_recognizerConfig
                                    delegate:self
                                       error:&error];
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

@end
