# react-native-spokestack

React Native wrapper for the [Spokestack](https://github.com/pylon/spokestack-android) speech activity detection/automated speech recognition project.

## Getting started
[![](https://img.shields.io/npm/v/react-native-spokestack.svg)](https://www.npmjs.com/package/react-native-spokestack)

`$ npm install react-native-spokestack --save`


- *Android*: Android SDK 26+
- *iOS*: iOS 11+

### (Mostly) automatic installation

#### Android

`$ react-native link react-native-spokestack`

#### iOS
[![](https://img.shields.io/cocoapods/v/RNSpokestack.svg)](https://cocoapods.org/pods/RNSpokestack)

#### Prerequistes
1. iOS 11+, Swift 4.2
2. No simulator support due to [dependencies](https://github.com/grpc/grpc-swift/issues/111). Debug/run on physical iOS devices only.

#### Installation

1. install [CocoaPods](https://guides.cocoapods.org/using/using-cocoapods.html#adding-pods-to-an-xcode-project), v1.6.0+
2. `cd ios && pod init`
3. edit the resulting `Podfile` and add the following contents:
```
platform :ios, '11.0'

target 'YOUR_PROJECT' do
  use_frameworks!

  pod 'RNSpokestack', :path => '../node_modules/react-native-spokestack'
  pod 'yoga', path: '../node_modules/react-native/ReactCommon/yoga'
  pod 'DoubleConversion', :podspec => '../node_modules/react-native/third-party-podspecs/DoubleConversion.podspec'
  pod 'Folly', :podspec => '../node_modules/react-native/third-party-podspecs/Folly.podspec'
  pod 'glog', :podspec => '../node_modules/react-native/third-party-podspecs/glog.podspec'
  pod 'React', path: '../node_modules/react-native', subspecs: [
  'Core',
  'jschelpers',
  'cxxreact',
  'CxxBridge',
  'DevSupport',
  'RCTText',
  'RCTImage',
  'RCTLinkingIOS',
  'RCTNetwork',
  'RCTActionSheet',
  'RCTAnimation',
  'RCTWebSocket',
  ]
end

```
4. `pod install`

### Manual installation

#### Android

1. Open up `android/app/src/main/java/[...]/MainApplication.java` (could also be called `MainActivity.java` or similar)

- Add `import com.pylon.RNSpokestack.RNSpokestackPackage;` to the imports at the top of the file
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
import RNSpokestack from "react-native-spokestack";

// initialize the Spokestack pipeline.
// The pipeline has three required top-level keys: 'input', 'stages', and 'properties'.
// For further examples, see https://github.com/pylon/spokestack-android#configuration
Spokestack.initialize({
  input: "com.pylon.spokestack.android.MicrophoneInput", // required, provides audio input into the stages
  stages: [
    "com.pylon.spokestack.webrtc.VoiceActivityDetector", // voice activity detection. necessary to trigger speech recognition.
    "com.pylon.spokestack.google.GoogleSpeechRecognizer" // one of the two supplied speech recognition services
    // 'com.pylon.spokestack.microsoft.BingSpeechRecognizer'
  ],
  properties: {
    locale: "en-US",
    "google-credentials": YOUR_GOOGLE_VOICE_CREDENTIALS, // Android-supported api
    "google-api-key": YOUR_GOOGLE_API_KEY, // iOS supported google api
    // 'bing-speech-api-key': YOUR_BING_VOICE_CREDENTIALS,
    trace-level: Spokestack.TraceLevel.DEBUG
  }
});

// Start and stop the speech pipeline. All methods can be called repeatedly.
RNSpokestack.start(); // start speech pipeline. can only start after initialize is called.
RNSpokestack.stop(); // stop speech pipeline
RNSpokestack.activate() // manually activate the speech pipeline. The speech pipeline is now actively listening for speech to recognize.
RNSpokestack.deactivate() // manually deactivate the speech pipeline. The speech pipeline is now passively waiting for an activation trigger.

// Binding events
const logEvent = e => console.log(e);
RNSpokestack.onActivate = logEvent;
RNSpokestack.onDeactivate = logEvent;
RNSpokestack.onError = e => {
  Spokestack.stop();
  logEvent(e);
};
RNSpokestack.onTrace = e => { // subscribe to tracing events according to the trace-level property
  logEvent(e);
  console.log(e.message);
}
RNSpokestack.onRecognize = e => {
  logEvent(e);
  console.log(e.transcript); // "Hello Spokestack"
};

```

## API

### Methods

| Method Name                | Description                                                                     | OS |
| -------------------------- | ------------------------------------------------------------------------------- | -- |
| RNSpokestack.initialize()  | Initialize the speech pipeline; required for all other methods                        | Android, iOS |
| RNSpokestack.start()         | Starts the speech pipeline. The speech pipeline starts in the `deactivate` state. | Android, iOS |
| RNSpokestack.stop()        | Stops the speech pipeline                                                       | Android, iOS |
| RNSpokestack.activate()    | Manually activate the speech pipeline                                           | Android |
| RNSpokestack.deactivate()  | Manually deactivate the speech pipeline                                         | Android |

### Events

| Event Name                           | Property | Description                             | OS |
| ------------------------------------ | -------- | --------------------------------------- | -- |
| RNSpokestack.onActivate(event)         | `null`   | Invoked when the speech pipeline is activated, which enables the speech recognizer and begins a new dialogue session                          | Android      |
| RNSpokestack.onDeactivate(event)     | `null`   | Invoked when the speech pipeline has been deactivated | Android |
| RNSpokestack.onRecognize(event)      | `transcript`:`string` | Invoked when speech has been recognized | Android, iOS |
| RNSpokestack.onTrace(event)          | `message`:`string` | Invoked when a trace message become available | Android      |
| RNSpokestack.onError(event)          | `error`:`string`       | Invoked upon an error in the speech pipeline execution | Android, iOS |

### Enums

| TraceLevel                           |    Value |
| ------------------------------------ | -------- |
| DEBUG                                |       10 |
| PERF                                 |       20 |
| INFO                                 |       30 |
| NONE                                 | 100      |

## Gotchas

### Android

- Requires Android SDK 26 level support
- Requires Gradle 3.0.1+ (`classpath 'com.android.tools.build:gradle:3.0.1'` in root `build.gradle` `dependencies`)
- Enable app setting for microphone permission

### iOS

- Enable app setting for microphone permission

## License

Copyright 2018 Pylon, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
