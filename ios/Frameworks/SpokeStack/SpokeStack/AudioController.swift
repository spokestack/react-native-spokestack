//
//  AudioController.swift
//  SpokeStack
//
//  Created by Cory D. Wiles on 9/28/18.
//  Copyright © 2018 Pylon AI, Inc. All rights reserved.
//

import Foundation
import AVFoundation

func recordingCallback(
    inRefCon: UnsafeMutableRawPointer,
    ioActionFlags: UnsafeMutablePointer<AudioUnitRenderActionFlags>,
    inTimeStamp: UnsafePointer<AudioTimeStamp>,
    inBusNumber: UInt32,
    inNumberFrames: UInt32,
    ioData: UnsafeMutablePointer<AudioBufferList>?) -> OSStatus {
    
    var status: OSStatus = noErr
    let channelCount: UInt32 = 1
    
    var bufferList = AudioBufferList()
    bufferList.mNumberBuffers = channelCount
    
    let buffers = UnsafeMutableBufferPointer<AudioBuffer>(start: &bufferList.mBuffers,
                                                          count: Int(bufferList.mNumberBuffers))
    buffers[0].mNumberChannels = 1
    buffers[0].mDataByteSize = inNumberFrames * 2
    buffers[0].mData = nil
    
    /// get the recorded samples
    
    status = AudioUnitRender(AudioController.shared.remoteIOUnit!,
                             ioActionFlags,
                             inTimeStamp,
                             inBusNumber,
                             inNumberFrames,
                             UnsafeMutablePointer<AudioBufferList>(&bufferList))
    if (status != noErr) {
        return status
    }

    let data: Data = Data(bytes: buffers[0].mData!, count: Int(buffers[0].mDataByteSize))
    
    DispatchQueue.main.async {
        AudioController.shared.delegate?.processSampleData(data)
    }
    
    return noErr
}

class AudioController {
    
    // MARK: Public (properties)
    
    static let shared: AudioController = AudioController()
    
    weak var delegate: AudioControllerDelegate?
    
    var sampleRate: Int = 16000
    
    var bufferDuration: TimeInterval = 10
    
    // MARK: Private (properties)
    
    fileprivate var remoteIOUnit: AudioComponentInstance?
    
    lazy private var audioComponentDescription: AudioComponentDescription = {
        
        var componentDescription: AudioComponentDescription = AudioComponentDescription()
        
        componentDescription.componentType = kAudioUnitType_Output
        componentDescription.componentSubType = kAudioUnitSubType_RemoteIO
        componentDescription.componentManufacturer = kAudioUnitManufacturer_Apple
        componentDescription.componentFlags = 0
        componentDescription.componentFlagsMask = 0
        
        return componentDescription
    }()
    
    // MARK: Initializers
    
    deinit {
        AudioComponentInstanceDispose(remoteIOUnit!)
    }
    
    // MARK: Public (methods)
    
    func startStreaming() -> Void {

        /// Prepare
        
        do {
        
            try self.prepare()
            self.start()

        } catch AudioError.audioSessionSetup(let message) {
        
            self.delegate?.setupFailed(message)
            
        } catch AudioError.general(let message) {
        
            self.delegate?.setupFailed(message)
            
        } catch {
        
            self.delegate?.setupFailed("An unknown error occured setting the stream")
        }
    }
    
    func stopStreaming() -> Void {
        self.stop()
    }
    
    // MARK: Private (methods)
    
    @discardableResult
    private func start() -> OSStatus {
        return AudioOutputUnitStart(remoteIOUnit!)
    }
    
    @discardableResult
    private func stop() -> OSStatus {
        return AudioOutputUnitStop(remoteIOUnit!)
    }
    
    @discardableResult
    private func prepare() throws -> OSStatus {
        
        var status: OSStatus = noErr
        let session: AVAudioSession = AVAudioSession.sharedInstance()
        
        /// AVSession setup
        
        do {
        
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .spokenAudio, options: .defaultToSpeaker)
            try session.setPreferredIOBufferDuration(self.bufferDuration)
            try session.setActive(true, options: .notifyOthersOnDeactivation)

        } catch {
            
            throw AudioError.audioSessionSetup(error.localizedDescription)
        }
        
        /// Session Sample Rate

        var sampleRate = session.sampleRate
        sampleRate = Double(self.sampleRate)

        /// Get the RemoteIO unit
        
        guard let remoteIOComponent: AudioComponent = AudioComponentFindNext(nil, &audioComponentDescription) else {
            throw AudioError.general("Failed to find the next audio component")
        }
        
        status = AudioComponentInstanceNew(remoteIOComponent, &remoteIOUnit)
        
        if status != noErr {
            return status
        }
        
        let bus1: AudioUnitElement = 1
        var oneFlag: UInt32 = 1
        
        /// Configure the RemoteIO unit for input

        status = AudioUnitSetProperty(self.remoteIOUnit!,
                                      kAudioOutputUnitProperty_EnableIO,
                                      kAudioUnitScope_Input,
                                      bus1,
                                      &oneFlag,
                                      UInt32(MemoryLayout<UInt32>.size));
        if status != noErr {
            return status
        }
        
        /// Set format for mic input (bus 1) on RemoteIO's output scope

        var asbd: AudioStreamBasicDescription = AudioStreamBasicDescription()

        asbd.mSampleRate = sampleRate
        asbd.mFormatID = kAudioFormatLinearPCM
        asbd.mFormatFlags = kAudioFormatFlagIsSignedInteger | kAudioFormatFlagIsPacked
        asbd.mBytesPerPacket = 2
        asbd.mFramesPerPacket = 1
        asbd.mBytesPerFrame = 2
        asbd.mChannelsPerFrame = 1
        asbd.mBitsPerChannel = 16
        
        status = AudioUnitSetProperty(self.remoteIOUnit!,
                                      kAudioUnitProperty_StreamFormat,
                                      kAudioUnitScope_Output,
                                      bus1,
                                      &asbd,
                                      UInt32(MemoryLayout<AudioStreamBasicDescription>.size))
        if (status != noErr) {
            return status
        }
        
        /// Set the recording callback
        
        var callbackStruct: AURenderCallbackStruct = AURenderCallbackStruct()
        
        callbackStruct.inputProc = recordingCallback
        callbackStruct.inputProcRefCon = nil
        status = AudioUnitSetProperty(self.remoteIOUnit!,
                                      kAudioOutputUnitProperty_SetInputCallback,
                                      kAudioUnitScope_Global,
                                      bus1,
                                      &callbackStruct,
                                      UInt32(MemoryLayout<AURenderCallbackStruct>.size));
        if status != noErr {
            return status
        }
        
        /// Initialize the RemoteIO unit
        
        return AudioUnitInitialize(self.remoteIOUnit!)
    }
}
