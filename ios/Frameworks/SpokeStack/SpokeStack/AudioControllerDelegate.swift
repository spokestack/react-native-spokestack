//
//  AudioControllerDelegate.swift
//  SpokeStack
//
//  Created by Cory D. Wiles on 9/28/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

import Foundation

protocol AudioControllerDelegate: AnyObject {
    
    func setupFailed(_ error: String) -> Void
    
    func processSampleData(_ data: Data) -> Void
}
