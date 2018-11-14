//
//  SpeechContext.swift
//  SpokeStack
//
//  Created by Cory D. Wiles on 10/1/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

import Foundation

@objc public class SPSpeechContext: NSObject {
    public var transcript: String
    public var confidence: Float
    init(transcript:String, confidence:Float) {
        self.transcript = transcript
        self.confidence = confidence
    }
}
