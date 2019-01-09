# react-native-spokestack

React Native wrapper for the [Spokestack](https://github.com/pylon/spokestack-android) speech activity detection/automated speech recognition project.

## Getting started

`$ npm install react-native-spokestack --save`

### Mostly automatic installation

`$ react-native link react-native-spokestack`

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

### Gradle Setup

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
    "google-credentials": YOUR_GOOGLE_VOICE_CREDENTIALS,
    // 'bing-speech-api-key': YOUR_BING_VOICE_CREDENTIALS,
    trace-level: Spokestack.TraceLevel.DEBUG
  }
});

// Start and stop the speech pipeline. All methods can be called repeatedly.
Spokestack.start(); // start speech pipeline. can only start after initialize is called.
Spokestack.stop(); // stop speech pipeline
Spokestack.activate() // manually activate the speech pipeline. The speech pipeline is now actively listening for speech to recognize.
Spokestack.deactivate() // manually deactivate the speech pipeline. The speech pipeline is now passively waiting for an activation trigger.

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
}
Spokestack.onRecognize = e => {
  logEvent(e);
  console.log(e.transcript); // "Hello Spokestack"
};

```

## API

### Methods

| Method Name                | Description                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- |
| Spokestack.initialize()    | Initialize the speech pipeline; required for all other methods                        |
| Spokestack.start()         | Starts the speech pipeline. The speech pipeline starts in the `deactivate` state. |
| Spokestack.stop()          | Stops the speech pipeline                                                       |
| Spokestack.activate()      | Manually activate the speech pipeline                                           |
| Spokestack.deactivate()    | Manually deactivate the speech pipeline                                         |

### Events

| Event Name                           | Property | Description                             |
| ------------------------------------ | -------- | --------------------------------------- |
| Spokestack.onActivate(event)           | `null`   | Invoked when the speech pipeline is activated, which enables the speech recognizer and begins a new dialogue session                          |
| Spokestack.onDeactivate(event)       | `null`   | Invoked when the speech pipeline has been deactivated |
| Spokestack.onRecognize(event)        | `transcript`:`string` | Invoked when speech has been recognized |
| Spokestack.onTrace(event)            | `message`:`string` | Invoked when a trace message become available |
| Spokestack.onError(event)            | `error`:`string`       | Invoked upon an error in the speech pipeline execution |

### Enums

| TraceLevel                           |    Value |
| ------------------------------------ | -------- |
| DEBUG                                |       10 |
| PERF                                 |       20 |
| INFO                                 |       30 |
| NONE                                 | 100      |

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
