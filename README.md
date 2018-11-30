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

// There are three events that can be bound with callbacks

// initialize the Spokestack pipeline.
// The pipeline has three required top-level keys: 'input', 'stages', and 'properties'.
// For further examples, see https://github.com/pylon/spokestack-android#configuration
Spokestack.initialize({
  input: "com.pylon.spokestack.android.MicrophoneInput", // required, provides audio input into the stages
  stages: [
    "com.pylon.spokestack.libfvad.VADTrigger", // enable voice activity detection. necessary to trigger speech recognition.
    "com.pylon.spokestack.google.GoogleSpeechRecognizer" // one of the two supplied speech recognition services
    // 'com.pylon.spokestack.microsoft.BingSpeechRecognizer'
  ],
  properties: {
    locale: "en-US",
    "google-credentials": YOUR_GOOGLE_VOICE_CREDENTIALS
    // 'bing-speech-api-key': YOUR_BING_VOICE_CREDENTIALS
  }
});

// Binding events
const logEvent = e => console.log(e);
Spokestack.onSpeechStarted = logEvent;
Spokestack.onSpeechEnded = logEvent;
Spokestack.onSpeechError = e => {
  Spokestack.stop();
  logEvent(e);
};
Spokestack.onSpeechRecognized = e => {
  logEvent(e);
  console.log(e.transcript); // "Hello Spokestack"
};

Spokestack.start(); // start voice activity detection and speech recognition. can only start after initialize is called.
Spokestack.stop(); // stop voice activity detection and speech recognition. can only start after initialize is called
// NB start() and stop() can be called repeatedly.
```

## API

| Method Name                | Description                                                                     | Platform |
| -------------------------- | ------------------------------------------------------------------------------- | -------- |
| Spokestack.initialize()    | Initialize the Spokestack VAD/ASR pipeline; required for `start()` and `stop()` | Android  |
| Spokestack.start()         | Starts listening for speech activity                                            | Android  |
| Spokestack.stop()          | Stops listening for speech activity                                             | Android  |

| Event Name                           | Event    | Description                             |
| ------------------------------------ | -------- | --------------------------------------- |
| Spokestack.onSpeechStarted(event)    | `null`   | Invoked when speech is recognized       |
| Spokestack.onSpeechEnded(event)      | `null`   | Invoked when speech has stopped         |
| Spokestack.onSpeechRecognized(event) | `string` | Invoked when speech has been recognized |
| Spokestack.onError(event)            | `string` | Invoked upon an error in the speech pipeline execution |
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
