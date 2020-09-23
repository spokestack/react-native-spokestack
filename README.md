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

- _React Native_: 0.60.0+
- _Android_: Android SDK 26+
- _iOS_: iOS 13+

## Usage

[Get started using Spokestack](https://www.spokestack.io/docs/React%20Native/getting-started), or check out our in-depth tutorials on [ASR](https://www.spokestack.io/docs/React%20Native/speech-pipeline), [NLU](https://www.spokestack.io/docs/React%20Native/nlu), and [TTS](https://www.spokestack.io/docs/React%20Native/tts). Also be sure to take a look at the [Cookbook](https://www.spokestack.io/docs/React%20Native/cookbook) for quick solutions to common problems!

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
| Spokestack.classify(utterance: string, {})    | Classify the utterance with an intent/slot natural language understanding model | utterance: string, context: dictionary (currently unused, can be empty) | iOS, Android          |

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
| Key        | Value  |
| ---------- | ------ |
| result     | dict   |

##### `result`

| Key        | Value  |
| ---------- | ------ |
| intent     | string |
| confidence | string |
| slots      | dict   |

##### `slots`
| Key        | Value  |
| ---------- | ------ |
| type       | string |
| value      | string |


### Enums
#### Trace

| TraceLevel | Value |
| ---------- | ----- |
| DEBUG      | 10    |
| PERF       | 20    |
| INFO       | 30    |
| NONE       | 100   |

#### Format
| TTSFormat      | Value |
| -------------- | ----- |
| TEXT           | 0     |
| SSML           | 1     |
| SPEECHMARKDOWN | 2     |

## Gotchas

### Android

- Requires Android SDK 26 level support
- Requires Gradle 3.0.1+ (`classpath 'com.android.tools.build:gradle:3.0.1'` in root `build.gradle` `dependencies`)
- Add app setting for microphone permission

The example usage uses the system-provided ASRs (`AndroidSpeechRecognizer` and `AppleSpeechRecognizer`). `AndroidSpeechRecognizer` is not available on 100% of devices, though; see our [ASR documentation](https://spokestack.io/docs/Concepts/asr) for more information. If you use a different ASR provider, you'll also need to change the `input` line to:

`input: "io.spokestack.spokestack.android.MicrophoneInput",`


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
