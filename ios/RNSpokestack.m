
#import "RNSpokestack.h"
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
  return @[@"SpeechEvent"];
}

- (void)onEvent:(NSNotification *)speechEvent
{
  NSString *eventName = speechEvent.userInfo[@"name"];
  if (hasListeners)
  {
    RCTLogInfo(@"Pretending to event %@", eventName);
    [self sendEventWithName:@"SpeechEvent" body:@{@"name": eventName}];
  }
}

// @property (nonatomic) SpeechPipeline* pipeline;

RCT_EXPORT_METHOD(initialize:(NSDictionary *)config)
{
  RCTLogInfo(@"Pretending to initialize with config %@", config);
}

RCT_EXPORT_METHOD(start:(NSString*)foo)
{
  RCTLogInfo(@"Pretending to start");
}

RCT_EXPORT_METHOD(stop)
{
  RCTLogInfo(@"Pretending to stop");
}

- (void)didFinish {
    
}

- (void)didRecognize:(SPSpeechContext * _Nonnull)result {
    
}

- (void)didStart {
    
}

@end
