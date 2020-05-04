# react-native-spokestack

React Native wrapper for the [Spokestack](https://spokestack.io) speech activity detection/automated speech recognition project.

<!--ts-->
## Table of Contents
  * [Getting started](#getting-started)
  * [Usage](#usage)
  * [API](#api)
  * [Gotchas](#gotchas)
  * [Release](#release)
  * [License](#license)
<!--te-->

## Getting started

[![](https://img.shields.io/npm/v/react-native-spokestack.svg)](https://www.npmjs.com/package/react-native-spokestack)

`$ npm install react-native-spokestack --save`

- _Android_: Android SDK 26+
- _iOS_: iOS 11+

### (Mostly) automatic installation

#### Android

`$ react-native link react-native-spokestack`

#### iOS

[![](https://img.shields.io/cocoapods/v/RNSpokestack.svg)](https://cocoapods.org/pods/RNSpokestack)

#### Prerequistes

1. iOS 11, Swift 5.0

#### Installation

1. install [CocoaPods](https://guides.cocoapods.org/using/using-cocoapods.html#adding-pods-to-an-xcode-project), v1.6.0+
2. `cd ios && pod init`
3. edit the resulting `Podfile` and add the following contents:

```
platform :ios, '11.0'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'YOUR_PROJECT' do
  use_frameworks!

  pod 'RNSpokestack', :path => '../node_modules/react-native-spokestack'

  pod 'FBLazyVector', :path => "../node_modules/react-native/Libraries/FBLazyVector"
  pod 'FBReactNativeSpec', :path => "../node_modules/react-native/Libraries/FBReactNativeSpec"
  pod 'RCTRequired', :path => "../node_modules/react-native/Libraries/RCTRequired"
  pod 'RCTTypeSafety', :path => "../node_modules/react-native/Libraries/TypeSafety"
  pod 'React', :path => '../node_modules/react-native/'
  pod 'React-Core', :path => '../node_modules/react-native/'
  pod 'React-CoreModules', :path => '../node_modules/react-native/React/CoreModules'
  pod 'React-Core/DevSupport', :path => '../node_modules/react-native/'
  pod 'React-RCTActionSheet', :path => '../node_modules/react-native/Libraries/ActionSheetIOS'
  pod 'React-RCTAnimation', :path => '../node_modules/react-native/Libraries/NativeAnimation'
  pod 'React-RCTBlob', :path => '../node_modules/react-native/Libraries/Blob'
  pod 'React-RCTImage', :path => '../node_modules/react-native/Libraries/Image'
  pod 'React-RCTLinking', :path => '../node_modules/react-native/Libraries/LinkingIOS'
  pod 'React-RCTNetwork', :path => '../node_modules/react-native/Libraries/Network'
  pod 'React-RCTSettings', :path => '../node_modules/react-native/Libraries/Settings'
  pod 'React-RCTText', :path => '../node_modules/react-native/Libraries/Text'
  pod 'React-RCTVibration', :path => '../node_modules/react-native/Libraries/Vibration'
  pod 'React-Core/RCTWebSocket', :path => '../node_modules/react-native/'
  pod 'React-cxxreact', :path => '../node_modules/react-native/ReactCommon/cxxreact'
  pod 'React-jsi', :path => '../node_modules/react-native/ReactCommon/jsi'
  pod 'React-jsiexecutor', :path => '../node_modules/react-native/ReactCommon/jsiexecutor'
  pod 'React-jsinspector', :path => '../node_modules/react-native/ReactCommon/jsinspector'
  pod 'ReactCommon/callinvoker', :path => "../node_modules/react-native/ReactCommon"
  pod 'ReactCommon/turbomodule/core', :path => "../node_modules/react-native/ReactCommon"
  pod 'Yoga', :path => '../node_modules/react-native/ReactCommon/yoga'

  use_native_modules!

end

pre_install do |installer|
  installer.analysis_result.specifications.each do |s|
    if s.name == 'TensorFlowLiteSwift'
      s.swift_version = '4.2'
    end
  end
end

```

4. `pod install`
5. Remove all `lib*` files from **Link Binary with Libraries** under your project target in xCode. This prevents [dueling installations of React](https://sandstorm.de/de/blog/post/react-native-managing-native-dependencies-using-xcode-and-cocoapods.html).

> ...thus we need to ensure that they reference the same React Native library which you link to from the outer project.

#### RN 0.58+ notes

- In the `Podfile` remove `jschelpers` from the React subspec. ([reference](https://github.com/facebook/react-native/commit/f85692cf8fb19d1334998ea647a25953dc849eee#diff-66230b3e029caa37b0fbdc8cbd47f4ab))
- If using Rn 0.58.0 - 0.58.4, an additional header [path](https://github.com/amccarri/react-native/commit/4e18338365175c1e7cceb784e98bf540b991c190#diff-66230b3e029caa37b0fbdc8cbd47f4ab) needs to be added to the `jsiexecutor` subspec in `node_modules/react-native/React.podspec`. You may use [patch-package](https://www.npmjs.com/package/patch-package) as a solution. This issue is was addressed and fixed in RN 0.58.5

### Manual installation

#### Android

1. Open up `android/app/src/main/java/[...]/MainApplication.java` (could also be called `MainActivity.java` or similar)

- Add `import io.spokestack.RNSpokestack.RNSpokestackPackage;` to the imports at the top of the file
- Add `new RNSpokestackPackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:
   ```
   include ':react-native-spokestack'
   project(':react-native-spokestack').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-spokestack/android')
   ```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   ```
     implementation project(':react-native-spokestack')
   ```

#### iOS (not using CocoaPods)

- Currently only buildable on an `amd_64` target

- Drag the RNSpokestack.xcodeproj from the react-native-spokestack/ios folder to the Libraries group on Xcode in your poject.

- Click on your main project file (the one that represents the .xcodeproj) select Build Phases and drag the static library, libRNSpokestack.a, from the Libraries/RNSpokestack.xcodeproj/Products folder to Link Binary With Libraries

##### Link the necessary libraries:

- Project Build Phases

  - Link Binary with Libraries:

    - /node_modules/react-native-spokestack/Frameworks
    - AVFoundation
    - SpokeStack.framework

  - Copy Bundle Resources:
    - gRCPCertificate.bundle

- General
  - Always Embed Swift Standard Libraries: Yes
  - Embedded Binaries:
    - /node_modules/react-native-spokestack/Frameworks
    - SpokeStack.framework
    - Linked Frameworks and Binaries:
    - /node_modules/react-native-spokestack/Frameworks
    - SpokeStack.framework

### Android Support

#### `android/build.gradle`

Make sure the Google repo is listed first

```
buildcripts {
   ...
    repositories {
      google()
      ...
    }
}

allprojects{
      repositories {
        google()
       ...
    }
}
```

#### `android/app/build.gradle`

```

...
android {
...
packagingOptions {
exclude 'project.properties'
exclude 'META-INF/INDEX.LIST'
exclude 'META-INF/DEPENDENCIES'
}
}
...

```

#### `android/app/src/main/AndroidManifest.xml`

```

<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## Usage

### Javascript

```javascript
import Spokestack from "react-native-spokestack";

// initialize the Spokestack pipeline.

// The pipeline has three required top-level keys: 'input', 'stages', and 'properties'.
// For further examples, see https://github.com/spokestack/spokestack-android#configuration
Spokestack.initialize({
  input: "io.spokestack.spokestack.android.MicrophoneInput", // required, provides audio input into the stages
  stages: [
    "io.spokestack.spokestack.webrtc.VoiceActivityDetector", // voice activity detection. necessary to trigger speech recognition.
    "io.spokestack.spokestack.google.GoogleSpeechRecognizer" // one of the two supplied speech recognition services
    // 'io.spokestack.spokestack.microsoft.AzureSpeechRecognizer'
  ],
  properties: {
    "locale": "en-US",
    "google-credentials": YOUR_GOOGLE_VOICE_CREDENTIALS, // Android-supported api
    // 'bing-speech-api-key': YOUR_BING_VOICE_CREDENTIALS,
    "trace-level": Spokestack.TraceLevel.DEBUG,
  },
  tts: {
    'ttsServiceClass': 'io.spokestack.spokestack.tts.SpokestackTTSService',
    // TTS API account properties. Only set these if you have a Spokestack account.
    'spokestack-id': 'f0bc990c-e9db-4a0c-a2b1-6a6395a3d97e', // your Spokestack API ID
    'spokestack-secret': '5BD5483F573D691A15CFA493C1782F451D4BD666E39A9E7B2EBE287E6A72C6B6' // your Spokestack API secret
  },
  nlu: {
    // NLU settings. Only set these if you are calling `Spokestack.classify`.
    'nlu-model-path': YOUR_NLU_MODEL_PATH, // string filesystem path to nlu model
    'nlu-metadata-path': YOUR_NLU_METADATA_PATH, // string filesystem path to nlu metadata
    'wordpiece-vocab-path': YOUR_NLU_VOCABULARY_PATH // string filesystem path to nlu vocab
  }
});

// Start and stop the speech pipeline. All methods can be called repeatedly.

Spokestack.start(); // start speech pipeline. can only start after initialize is called.
Spokestack.stop(); // stop speech pipeline
Spokestack.activate(); // manually activate the speech pipeline. The speech pipeline is now actively listening for speech to recognize.
Spokestack.deactivate(); // manually deactivate the speech pipeline. The speech pipeline is now passively waiting for an activation trigger.

// Binding events

const logEvent = e => console.log(e);
Spokestack.onActivate = logEvent;
Spokestack.onDeactivate = logEvent;
Spokestack.onError = e => {
  Spokestack.stop();
  logEvent(e);
};
Spokestack.onTrace = e => { // subscribe to tracing events according to the trace-level property
  logEvent(e);
  console.log(e.message);
};
Spokestack.onRecognize = e => {
  logEvent(e);
  console.log(e.transcript) // "Hello Spokestack"

  // Classify the intent and slot of the transcript
  Spokestack.classify(e.transcript, {})

  // Get a URL to a real-time synthesize
  Spokestack.synthesize({'input': e.transcript, 'format': Spokestack.TTSFormat.TEXT, 'voice': 'demo-male'})
};

// Receive the transcript classifcation result
Spokestack.onClassification = e => {
  logEvent(JSON.stringify(e))
  console.log(e.result.intent)
}

// Receive the real-time transcript synthesis result
Spokestack.onSuccess = e => {
  logEvent(JSON.stringify(e))
  console.log(e.url) // https://api.spokestack.io/stream/g2dkABVnYXRld2F5QDE3Mi4yNy4xMi4yNDQAACeUAAAAAgE
};

```

## API

### Methods

                                                           | Method Name                | Description                                                                     | Method Values  | OS           |
                                                           | -------------------------- | ------------------------------------------------------------------------------- | -------------  | --           |
                                                           | Spokestack.initialize()    | Initialize the speech pipeline; required for all other methods                  |   | Android, iOS |
                                                           | Spokestack.start()         | Starts the speech pipeline. The speech pipeline starts in the `deactivate` state. | | Android, iOS |
                                                           | Spokestack.stop()          | Stops the speech pipeline                                                         | | Android, iOS |
                                                           | Spokestack.activate()      | Manually activate the speech pipeline                                             | | Android, iOS |
                                                           | Spokestack.deactivate()    | Manually deactivate the speech pipeline                                           | | Android, iOS |
                                                           | Spokestack.synthesize({'input': string, 'format': int, 'voice': string})             | Request a URL to a audio file of the specified voice speaking the input | format [0: text, 1: ssml, 2: speechmarkdown], voice ["demo-male"] | iOS, Android          |
                                                           | Spokestack.classify(utterance: string, {})    | Classify the utterance with an intent/slot natural language understanding model | utterance: string | iOS, Android          |

### Events

                                                           | Event Name                           | Property              | Description                                                                                                          | OS           |
                                                           | ------------------------------------ | --------              | ---------------------------------------                                                                              | --           |
                                                           | onActivate(event)         | `null`                | Invoked when the speech pipeline is activated, which enables the speech recognizer and begins a new dialogue session | Android, iOS |
                                                           | onDeactivate(event)       | `null`                | Invoked when the speech pipeline has been deactivated                                                                | Android, iOS |
                                                           | onStart(event)            | `null`                | Invoked when the speech pipeline is started                                                                          | Android, iOS |
                                                           | onStop(event)             | `null`                | Invoked when the speech pipeline has been stopped                                                                    | Android, iOS |
                                                           | onRecognize(event)        | `transcript`:`string` | Invoked when speech has been recognized                                                                              | Android, iOS |
                                                           | onTimeout(event)          | `null`                | Invoked when no speech has been detected for `wake-active-max` after activation                                      | Android, iOS |
                                                           | onTrace(event)            | `message`:`string`    | Invoked when a trace message become available                                                                        | Android      |
                                                           | onError(event)            | `error`:`string`      | Invoked upon an error in the speech pipeline execution                                                               | Android, iOS |
                                                           | onSuccess(ttsEvent)          | `url`:`string`   | Invoked upon a successful TTS synthesis request                | iOS          |
                                                           | onFailure(ttsEvent)          | `error`:`string` | Invoked upon a failed TTS synthesis request                    | iOS          |
                                                           | onClassification(nluEvent) | `result`:`dictionary` | Invoked upon a successful NLU utterance classification | iOS          |

### Dictionaries
#### `nluEvent`
                                                           | Key | Value |
                                                           | --- | ----- |
                                                           |     |       |

### Enums
#### Trace

                                                           | TraceLevel | Value |
                                                           | ---------- | ----- |
                                                           | DEBUG      | 10    |
                                                           | PERF       | 20    |
                                                           | INFO       | 30    |
                                                           | NONE       | 100   |

#### Format
                                                           | TTSFormat    | Value |
                                                           | ------------ | ----- |
                                                           | TEXT         | 0     |
                                                           | SSML         | 1     |
                                                           | SPEECHMARKUP | 2     |

## Gotchas

### Android

- Requires Android SDK 26 level support
- Requires Gradle 3.0.1+ (`classpath 'com.android.tools.build:gradle:3.0.1'` in root `build.gradle` `dependencies`)
- Add app setting for microphone permission

### iOS

- Add app setting for microphone permission (`NSMicrophoneUsageDescription`) and speech recognition (`NSSpeechRecognitionUsageDescription`)
- Spokestack on iOS does not manage `AudioSession` settings. The client app is required to implement whatever `AudioSession` category and options are necessary. At minimum, the session category should allow for recording, eg `AVAudioSessionCategoryRecord` or `AVAudioSessionCategoryPlayAndRecord`. A simple `AudioSession` setting, suitable for insertion in `AppDelegate.m`, could be:
```
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeDefault options:AVAudioSessionCategoryOptionDefaultToSpeaker  error:nil];
  [[AVAudioSession sharedInstance] setActive:YES error:nil];
```

## Release
  1. Ensure that CocoaPods has been installed via `gem`, not via `brew`
  2. Increment `version` in `package.json`
  3. `git commit -a -m 'YOUR_COMMIT_MESSAGE' && git tag YOUR_VERSION && git push --origin`
  4. `pod spec lint --use-libraries --allow-warnings --use-modular-headers`,  which should pass all but one checks (expect `ERROR | [iOS] xcodebuild: Returned an unsuccessful exit code. You can use `--verbose` for more information.`)
  5. edit `/Library/Ruby/Gems/YOUR_RUBY_VERSION/gems/cocoapods-trunk-YOUR_COCOAPODS_VERSION/lib/pod/command/trunk/push.rb`, comment out `validate_podspec_files` (https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/command/repo/push.rb#L77)* 
  6. `pod trunk register YOUR_EMAIL --description='release YOUR_PODSPEC_VERSION'`
  7. `npm publish` to release on NPM
  8. `pod trunk push --use-libraries --allow-warnings --use-modular-headers`

* Since `RNSpokestack` iOS requires React Native headers, but does not include any React Native dependencies, it will not compile by itself, needing a client library that does include the React Native dependency.



## License

Copyright 2020 Spokestack, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
