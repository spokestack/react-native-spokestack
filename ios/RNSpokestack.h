
#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif
#import <React/RCTEventEmitter.h>
#import "SpokeStack/SpokeStack-Swift.h"

@interface RNSpokestack : RCTEventEmitter <RCTBridgeModule, SpeechRecognizer>

@end
