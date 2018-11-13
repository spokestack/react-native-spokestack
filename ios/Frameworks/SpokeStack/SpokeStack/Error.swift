//
//  Error.swift
//  SpokeStack
//
//  Created by Cory D. Wiles on 9/28/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

import Foundation

enum AudioError: Error {
    case general(String)
    case audioSessionSetup(String)
}

public enum SpeechPipleError: Error {
    case invalidInitialzation(String)
}
