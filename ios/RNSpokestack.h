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

@interface RNSpokestack : RCTEventEmitter <RCTBridgeModule, SpeechEventListener, PipelineDelegate>
@property (nonatomic) SpeechPipeline *pipeline;
@property (weak, nonatomic) id <SpeechProcessor> asrService;
@property (weak, nonatomic) id <SpeechProcessor> wakewordService;
@property (nonatomic) SpeechConfiguration *speechConfig;
@end
