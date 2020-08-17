//
//  RNEventBridge.h
//  RNSpokestack
//
//  Created by Noel Weichbrodt on 11/26/18.
//  Copyright © 2020 Spokestack, Inc. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Spokestack/Spokestack-Swift.h>

API_AVAILABLE(ios(13.0))
@interface RNSpokestack : RCTEventEmitter <RCTBridgeModule, SpeechEventListener, TextToSpeechDelegate, NLUDelegate>
@property (nonatomic) SpeechPipeline *pipeline;
@property (nonatomic) TextToSpeech *tts;
@property (nonatomic) NLUTensorflow *nlu;
@property (nonatomic) id <SpeechProcessor> asrService;
@property (nonatomic) id <SpeechProcessor> wakewordService;
@property (nonatomic) SpeechConfiguration *speechConfig;
@property (nonatomic) SpeechContext *speechContext;
@end
