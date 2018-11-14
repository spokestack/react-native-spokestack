//
//  SpeechRecognizer.swift
//  SpokeStack
//
//  Created by Cory D. Wiles on 10/1/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

import Foundation

@objc public protocol SpeechRecognizer: AnyObject {
    
    func didStart() -> Void
    
    func didRecognize(_ result: SPSpeechContext) -> Void
    
    func didFinish() -> Void
}
