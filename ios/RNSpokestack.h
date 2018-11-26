//
//  RNEventBridge.h
//  RNSpokestack
//
//  Created by Noel Weichbrodt on 11/26/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <SpokeStack/SpokeStack-Swift.h>

@interface RNSpokestack : RCTEventEmitter <RCTBridgeModule, SpeechRecognizer>
@end
