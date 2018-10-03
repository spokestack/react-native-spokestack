
# spokestack-react-native

React Native wrapper for the [Spokestack](https://github.com/pylon/spokestack-android) speech activity detection/automated speech recognition project.

## Getting started

`$ npm install spokestack-react-native --save`

### Mostly automatic installation

`$ react-native link spokestack-react-native`

### Manual installation

#### Android

1. Open up `android/app/src/main/java/[...]/MainApplication.java` (could also be called `MainActivity.java` or similar)
  - Add `import com.pylon.RNSpokestack.RNSpokestackPackage;` to the imports at the top of the file
  - Add `new RNSpokestackPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':spokestack-react-native'
  	project(':spokestack-react-native').projectDir = new File(rootProject.projectDir, 	'../node_modules/spokestack-react-native/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':spokestack-react-native')
  	```

### Gradle Setup

#### `android/app/build.gradle`
```
buildscript {
  repositories {
    mavenLocal()
    mavenCentral()
    jcenter()
  }
  dependencies {
    classpath 'com.nabilhachicha:android-native-dependencies:0.1.2'
  }
}

apply plugin: 'android-native-dependencies'

android {
  compileSdkVersion 26 // miniumum
  defaultConfig {
    multiDexEnabled true
  }
  packagingOptions {
    exclude 'project.properties'
    exclude 'META-INF/INDEX.LIST'
    exclude 'META-INF/io.netty.versions.properties'
    pickFirst 'lib/armeabi-v7a/libspokestack.so'
  }
}

dependencies {
  annotationProcessor 'com.google.auto.value:auto-value:1.2' // spokestack google
  implementation 'io.grpc:grpc-okhttp:1.10.0'    // spokestack google (must replace grpc-netty on android)
  implementation 'com.google.code.gson:gson:2.8.2'
  implementation project(':spokestack-react-native')
}

native_dependencies {
    artifact 'com.pylon:spokestack:0.1.8'
}
```
#### `android/app/src/main/AndroidManifest.xml`
```
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## Usage

### Javascript

```javascript
import RNSpokestack from 'spokestack-react-native'

// There are three events that can be bound with callbacks
RNSpokestack.onSpeechStarted = this._onSpeechStart.bind(this)
RNSpokestack.onSpeechRecognized = this._onSpeechRecognized.bind(this)
RNSpokestack.onSpeechEnded = this._onSpeechEnd.bind(this)

// initialize the Spokestack pipeline. 
// The pipeline has three required top-level keys: 'input', 'stages', and 'properties'.
// For further examples, see https://github.com/pylon/spokestack-android#configuration
RNSpokestack.initialize({
  'input': 'com.pylon.spokestack.android.MicrophoneInput', // required, provides audio input into the stages
  'stages': [
    'com.pylon.spokestack.libfvad.VADTrigger', // enable voice activity detection. necessary to trigger speech recognition.
    'com.pylon.spokestack.google.GoogleSpeechRecognizer' // one of the two supplied speech recognition services
    // 'com.pylon.spokestack.microsoft.BingSpeechRecognizer'
  ],
  'properties': {
    'locale': 'en-US',
    'google-credentials': YOUR_GOOGLE_VOICE_CREDENTIALS
    // 'bing-speech-api-key': YOUR_BING_VOICE_CREDENTIALS
  }
})

RNSpokestack.start() // start voice activity detection and speech recognition. can only start after initialize is called.
RNSpokestack.stop() // stop voice activity detection and speech recognition. can only start after initialize is called
// NB start() and stop() can be called repeatedly.
```

## API

Method Name                 | Description                                                                         | Platform
--------------------------- | ----------------------------------------------------------------------------------- | --------
RNSpokestack.initialize()       | Initialize the Spokestack VAD/ASR pipeline; required for `start()` and `stop()`                                      | Android
RNSpokestack.start()               | Starts listening for speech activity  | Android
RNSpokestack.stop()                | Stops listening for speech activity                      | Android

Event Name                          | Description                                            | Event                           
----------------------------------- | ------------------------------------------------------ | -----------------------------------------------
Voice.onSpeechStarted(event)     | Invoked when speech is recognized                    | `null`
Voice.onSpeechEnded(event)            | Invoked when speech has stopped       | `null`
Voice.onSpeechRecognized(event)        | Invoked when speech has been recognized | `string`

## Gotchas
  - Requires Android SDK 26 level support
  - Requires Gradle 3.0.1+ (`classpath 'com.android.tools.build:gradle:3.0.1'` in root `build.gradle` `dependencies`)
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
