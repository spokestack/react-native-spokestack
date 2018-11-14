//
//  GoogleRecognizerConfiguration.swift
//  SpokeStack
//
//  Created by Cory D. Wiles on 9/28/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

import Foundation

@objc public class GoogleRecognizerConfiguration: RecognizerConfiguration {
    
    public var host = "speech.googleapis.com"
    public var apiKey = "12344"
    public var enableWordTimeOffsets = true
    public var maxAlternatives: Int32 = 30
    public var singleUtterance = false
    public var interimResults = true
}
