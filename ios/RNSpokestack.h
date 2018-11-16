
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <SpokeStack/SpokeStack-Swift.h>

@interface RNSpokestack : RCTEventEmitter <RCTBridgeModule, SpeechRecognizer>
//NSObject <RCTBridgeModule, SpeechRecognizer>
@end
