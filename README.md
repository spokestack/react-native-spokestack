# react-native-spokestack

React Native plugin for adding voice using [Spokestack](https://www.spokestack.io). This includes speech recognition, wakeword, and natural language understanding, as well as synthesizing text to speech using Spokestack voices.

## Requirements

- _React Native_: 0.60.0+
- _Android_: Android SDK 24+
- _iOS_: iOS 13+

## Installation

[![](https://img.shields.io/npm/v/react-native-spokestack.svg)](https://www.npmjs.com/package/react-native-spokestack)

Using npm:

```sh
npm install --save react-native-spokestack
```

or using yarn:

```sh
yarn add react-native-spokestack
```

Then follow the instructions for each platform to link react-native-spokestack to your project:

## iOS installation

<details>
  <summary>iOS details</summary>

### Edit Podfile

Before running `pod install`, make sure to make the following edits.

react-native-spokestack makes use of relatively new APIs only available in iOS 13+. Make sure to set your deployment target to iOS 13 at the top of your Podfile:

Also set your deployment target to 13.0 in your XCode project.

```ruby
platform :ios, '13.0'
```

We also need to use `use_frameworks!` in our Podfile in order to support dependencies written in Swift.

```ruby
target 'SpokestackExample' do
  use_frameworks!
  #...
```

For the time being, `use_frameworks!` does not work with Flipper, so we also need to disable Flipper. Remove any Flipper-related lines in your Podfile. In React Native 0.63.2, they look like this:

```ruby
  # X Remove or comment out these lines X
  use_flipper!
  post_install do |installer|
    flipper_post_install(installer)
  end
  # XX
```

Remove your existing Podfile.lock and Pods folder to ensure no conflicts, then install the pods:

```sh
$ npx pod-install
```

### Edit Info.plist

Add the following to your Info.plist to enable permissions. In XCode, also ensure your iOS deployment target is set to 13.0 or higher.

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app uses the microphone to hear voice commands</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app uses speech recognition to process voice commands</string>
```

#### Remove Flipper

While Flipper works on fixing their pod for `use_frameworks!`, we must disable Flipper. We already removed the Flipper dependencies from Pods above, but there remains some code in the AppDelegate.m that imports Flipper. There are two ways to fix this.

1. You can disable Flipper imports without removing any code from the AppDelegate. To do this, open your xcworkspace file in XCode. Go to your target, then Build Settings, search for "C Flags", remove `-DFB_SONARKIT_ENABLED=1` from flags.
1. Remove all Flipper-related code from your AppDelegate.m.

In our example app, we've done option 1 and left in the Flipper code in case they get it working in the future and we can add it back.

### Edit AppDelegate.m

#### Add AVFoundation to imports

```objc
#import <AVFoundation/AVFoundation.h>
```

#### AudioSession category

Set the AudioSession category. There are several configurations that work.

The following is a suggestion that should fit most use cases:

```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setCategory:AVAudioSessionCategoryPlayAndRecord
     mode:AVAudioSessionModeDefault
  options:AVAudioSessionCategoryOptionDefaultToSpeaker | AVAudioSessionCategoryOptionAllowAirPlay | AVAudioSessionCategoryOptionAllowBluetoothA2DP | AVAudioSessionCategoryOptionAllowBluetooth
    error:nil];
  [session setActive:YES error:nil];

  // ...
```

</details>

## Android installation

<details>
  <summary>Android details</summary>

### ASR Support

The example usage uses the system-provided ASRs (`AndroidSpeechRecognizer` and `AppleSpeechRecognizer`). However, `AndroidSpeechRecognizer` is not available on 100% of devices. If such a device is supported, use Spokestack ASR instead.

See our [ASR documentation](https://www.spokestack.io/docs/concepts/asr) for more information.

### Edit root build.gradle (_not_ app/build.gradle)

```groovy
// ...
  ext {
    // Minimum SDK is 24
    minSdkVersion = 24
// ...
  dependencies {
    // Minimium gradle is 3.0.1+
    // The latest React Native already has this
    classpath("com.android.tools.build:gradle:3.5.3")
```

### Edit AndroidManifest.xml

Add the necessary permissions to your `AndroidManifest.xml`. The first permission is often there already. The second is needed for using the microphone.

```xml
    <!-- For TTS -->
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- For wakeword and ASR -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Request RECORD_AUDIO permission

The responsibility to request permission for RECORD_AUDIO on new devices is left to the user, as there are differing strategies for how to handle permissions.

1. Add a screen to your onboarding that explains the need for the permissions used on each platform (RECORD_AUDIO on Android and Microphone and Speech Recognition on iOS). **Recommended**
2. Request the permissions only when needed. This is also a good option as it avoids asking for permission as soon as the app is launched. Avoid asking for permission with no context or without making it clear why it is needed.

While iOS will bring up permissions dialogs automatically for any permissions needed, you must do this manually in Android.

React Native already provides a module for this. See [React Native's PermissionsAndroid](https://reactnative.dev/docs/permissionsandroid) for more info.

</details>

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## Usage

[Get started using Spokestack](https://www.spokestack.io/docs/React%20Native/getting-started), or check out our in-depth tutorials on [ASR](https://www.spokestack.io/docs/React%20Native/speech-pipeline), [NLU](https://www.spokestack.io/docs/React%20Native/nlu), and [TTS](https://www.spokestack.io/docs/React%20Native/tts). Also be sure to take a look at the [Cookbook](https://www.spokestack.io/docs/React%20Native/cookbook) for quick solutions to common problems.

A working example app is included in this repo in the `example/` folder.

```js
import Spokestack from 'react-native-spokestack'
import { View, Button, Text } from 'react-native'

function App() {
  const [listening, setListening] = useState(false)

  const onActivate = () => setListening(true)
  const onDeactivate = () => setListening(false)
  const onRecognize = ({ transcript }) => console.log(transcript)

  useEffect(() => {
    Spokestack.addEventListener('activate', onActivate)
    Spokestack.addEventListener('deactivate', onDeactivate)
    Spokestack.addEventListener('recognize', onRecognize)
    Spokestack.initialize(
      process.env.SPOKESTACK_CLIENT_ID,
      process.env.SPOKESTACK_CLIENT_SECRET
    )
      // This example starts the Spokestack pipeline immediately,
      // but it could be delayed until after onboarding or other
      // conditions have been met.
      .then(Spokestack.start)

    return () => {
      Spokestack.removeAllListeners()
    }
  }, [])

  return (
    <View>
      <Button onClick={() => Spokestack.activate()} title="Listen" />
      <Text>{listening ? 'Listening...' : 'Idle'}</Text>
    </View>
  )
}
```

---

# API Documentation

### initialize

▸ **initialize**(`clientId`: string, `clientSecret`: string, `config?`: [SpokestackConfig](#SpokestackConfig)): Promise\<void>

_Defined in [src/index.tsx:55](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L55)_

Initialize the speech pipeline; required for all other methods.

The first 2 args are your Spokestack credentials
available for free from https://spokestack.io.
Avoid hardcoding these in your app.
There are several ways to include
environment variables in your code.

Using process.env:
https://babeljs.io/docs/en/babel-plugin-transform-inline-environment-variables/

Using a local .env file ignored by git:
https://github.com/goatandsheep/react-native-dotenv
https://github.com/luggit/react-native-config

See [SpokestackConfig](#SpokestackConfig) for all available options.

```js
import Spokestack from 'react-native-spokestack'

// ...

await Spokestack.initialize(process.env.CLIENT_ID, process.env.CLIENT_SECRET, {
  pipeline: {
    profile: Spokestack[PipelineProfile](#PipelineProfile).PTT_NATIVE_ASR
  }
})
```

#### Parameters:

| Name           | Type                                  |
| -------------- | ------------------------------------- |
| `clientId`     | string                                |
| `clientSecret` | string                                |
| `config?`      | [SpokestackConfig](#SpokestackConfig) |

**Returns:** Promise\<void>

---

### start

▸ **start**(): Promise\<void>

_Defined in [src/index.tsx:73](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L73)_

Start the speech pipeline.
The speech pipeline starts in the `deactivate` state.

```js
import Spokestack from 'react-native-spokestack`

// ...

Spokestack.initialize(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
  .then(Spokestack.start)
```

**Returns:** Promise\<void>

---

### stop

▸ **stop**(): Promise\<void>

_Defined in [src/index.tsx:86](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L86)_

Stop the speech pipeline.
This effectively stops ASR, VAD, and wakeword.

```js
import Spokestack from 'react-native-spokestack`

// ...

await Spokestack.stop()
```

**Returns:** Promise\<void>

---

### activate

▸ **activate**(): Promise\<void>

_Defined in [src/index.tsx:101](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L101)_

Manually activate the speech pipeline.
This is necessary when using a PTT profile.
VAD profiles can also activate ASR without the need
to call this method.

```js
import Spokestack from 'react-native-spokestack`

// ...

<Button title="Listen" onClick={() => Spokestack.activate()} />
```

**Returns:** Promise\<void>

---

### deactivate

▸ **deactivate**(): Promise\<void>

_Defined in [src/index.tsx:116](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L116)_

Deactivate the speech pipeline.
If the profile includes wakeword, the pipeline will go back
to listening for the wakeword.
If VAD is active, the pipeline can reactivate without calling activate().

```js
import Spokestack from 'react-native-spokestack`

// ...

<Button title="Stop listening" onClick={() => Spokestack.deactivate()} />
```

**Returns:** Promise\<void>

---

### addEventListener

• **addEventListener**: _typeof_ addListener

_Defined in [src/index.tsx:175](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L175)_

Bind to any event emitted by the native libraries
The events are: "recognize", "partial_recognize", "error", "activate", "deactivate", and "timeout".
See the bottom of the README.md for descriptions of the events.

```js
useEffect(() => {
  const listener = Spokestack.addEventListener('recognize', onRecognize)
  // Unsubsribe by calling remove when components are unmounted
  return () => {
    listener.remove()
  }
}, [])
```

---

### removeEventListener

• **removeEventListener**: _typeof_ removeListener

_Defined in [src/index.tsx:183](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L183)_

Remove an event listener

```js
Spokestack.removeEventListener('recognize', onRecognize)
```

---

### removeAllListeners

• **removeAllListeners**: () => void

_Defined in [src/index.tsx:193](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L193)_

Remove any existing listeners

```js
componentWillUnmount() {
  Spokestack.removeAllListeners()
}
```

---

### synthesize

▸ **synthesize**(`input`: string, `format?`: [TTSFormat](#TTSFormat), `voice?`: string): Promise\<string>

_Defined in [src/index.tsx:129](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L129)_

Synthesize some text into speech
Returns `Promise<string>` with the string
being the URL for a playable mpeg.

There is currently only one free voice available ("demo-male").

```js
const url = await Spokestack.synthesize('Hello world')
play(url)
```

#### Parameters:

| Name      | Type                    |
| --------- | ----------------------- |
| `input`   | string                  |
| `format?` | [TTSFormat](#TTSFormat) |
| `voice?`  | string                  |

**Returns:** Promise\<string>

---

### speak

▸ **speak**(`input`: string, `format?`: [TTSFormat](#TTSFormat), `voice?`: string): Promise\<void>

_Defined in [src/index.tsx:144](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/index.tsx#L144)_

Synthesize some text into speech
and then immediately play the audio through
the default audio system.
Audio session handling can get very complex and we recommend
using a RN library focused on audio for anything more than
very simple playback.

There is currently only one free voice available ("demo-male").

```js
await Spokestack.speak('Hello world')
```

#### Parameters:

| Name      | Type                    |
| --------- | ----------------------- |
| `input`   | string                  |
| `format?` | [TTSFormat](#TTSFormat) |
| `voice?`  | string                  |

**Returns:** Promise\<void>

---

### TTSFormat

• **SPEECHMARKDOWN**: = 2

_Defined in [src/types.ts:63](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L63)_

• **SSML**: = 1

_Defined in [src/types.ts:62](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L62)_

• **TEXT**: = 0

_Defined in [src/types.ts:61](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L61)_

---

# Events

Use `Spokestack.addEventListener()`, `Spokestack.removeEventListener()`, and `Spokestack.removeAllListeners()` to add and remove events handlers. All events are available in both iOS and Android.

| Name              |           Data           |                                                                   Description |
| :---------------- | :----------------------: | ----------------------------------------------------------------------------: |
| recognize         | `{ transcript: string }` |                     Fired whenever speech recognition completes successfully. |
| partial_recognize | `{ transcript: string }` |              Fired whenever the transcript changes during speech recognition. |
| timeout           |          `null`          |           Fired when an active pipeline times out due to lack of recognition. |
| activate          |          `null`          | Fired when the speech pipeline activates, either through the VAD or manually. |
| deactivate        |          `null`          |                                   Fired when the speech pipeline deactivates. |
| play              |  `{ playing: boolean }`  |         Fired when TTS playback starts and stops. See the `speak()` function. |
| error             |   `{ error: string }`    |                                    Fired when there's an error in Spokestack. |

_When an error event is triggered, any existing promises are rejected as it's difficult to know exactly from where the error originated and whether it may affect other requests._

---

## SpokestackConfig

These are the configuration options that can be passed to `Spokestack.initialize(_, _, spokestackConfig)`. No options in SpokestackConfig are required.

SpokestackConfig has the following structure:

```ts
interface SpokestackConfig {
  traceLevel: TraceLevel
  // Most options are advanced aside from "profile"
  pipeline: PipelineConfig
  // Only needed for Spokestack.classify
  nlu: NLUConfig
  // Needed for wakeword
  // Most options are advanced aside from
  // filterPath, encodePath, and decodePath
  // for passing config files.
  wakeword: WakewordConfig
}
```

### TraceLevel

• **DEBUG**: = 10

_Defined in [src/types.ts:48](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L48)_

• **INFO**: = 30

_Defined in [src/types.ts:50](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L50)_

• **NONE**: = 100

_Defined in [src/types.ts:51](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L51)_

• **PERF**: = 20

_Defined in [src/types.ts:49](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L49)_

## PipelineConfig

### profile

• `Optional` **profile**: [PipelineProfile](#PipelineProfile)

_Defined in [src/types.ts:104](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L104)_

Profiles are collections of common configurations for Pipeline stages.
Default: PTT_NATIVE_ASR

### PipelineProfile

• **PTT_NATIVE_ASR**: = 2

_Defined in [src/types.ts:22](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L22)_

Apple/Android Automatic Speech Recogntion is on
when the speech pipeline is active.
This is likely the more common profile
when not using wakeword.

• **PTT_SPOKESTACK_ASR**: = 5

_Defined in [src/types.ts:40](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L40)_

Spokestack Automatic Speech Recogntion is on
when the speech pipeline is active.
This is likely the more common profile
when not using wakeword, but Spokestack ASR is preferred.

• **TFLITE_WAKEWORD_NATIVE_ASR**: = 0

_Defined in [src/types.ts:10](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L10)_

Set up wakeword and use local Apple/Android ASR.
Note that wakeword.filterPath, wakeword.encodePath, and wakeword.detectPath
are required if any wakeword profile is used.

• **TFLITE_WAKEWORD_SPOKESTACK_ASR**: = 3

_Defined in [src/types.ts:28](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L28)_

Set up wakeword and use remote Spokestack ASR.
Note that wakeword.filterPath, wakeword.encodePath, and wakeword.detectPath
are required if any wakeword profile is used.

• **VAD_NATIVE_ASR**: = 1

_Defined in [src/types.ts:15](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L15)_

Apple/Android Automatic Speech Recognition is on
when Voice Active Detection triggers it.

• **VAD_SPOKESTACK_ASR**: = 4

_Defined in [src/types.ts:33](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L33)_

Spokestack Automatic Speech Recognition is on
when Voice Active Detection triggers it.

### sampleRate

• `Optional` **sampleRate**: number

_Defined in [src/types.ts:108](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L108)_

Audio sampling rate, in Hz

---

### frameWidth

• `Optional` **frameWidth**: number

_Defined in [src/types.ts:114](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L114)_

**`advanced`**

Speech frame width, in ms

---

### bufferWidth

• `Optional` **bufferWidth**: number

_Defined in [src/types.ts:120](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L120)_

**`advanced`**

Buffer width, used with frameWidth to determine the buffer size

---

### vadMode

• `Optional` **vadMode**: \"quality\" \| \"low-bitrate\" \| \"aggressive\" \| \"very-aggressive\"

_Defined in [src/types.ts:124](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L124)_

Voice activity detector mode

---

### vadFallDelay

• `Optional` **vadFallDelay**: number

_Defined in [src/types.ts:131](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L131)_

**`advanced`**

Falling-edge detection run length, in ms; this value determines
how many negative samples must be received to flip the detector to negative

---

### vadRiseDelay

• `Optional` **vadRiseDelay**: number

_Defined in [src/types.ts:140](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L140)_

**`advanced`**

Android-only

Rising-edge detection run length, in ms; this value determines
how many positive samples must be received to flip the detector to positive

---

### ansPolicy

• `Optional` **ansPolicy**: \"mild\" \| \"medium\" \| \"aggressive\" \| \"very-aggressive\"

_Defined in [src/types.ts:148](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L148)_

**`advanced`**

Android-only for AcousticNoiseSuppressor

Noise policy

---

### agcCompressionGainDb

• `Optional` **agcCompressionGainDb**: number

_Defined in [src/types.ts:157](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L157)_

**`advanced`**

Android-only for AcousticGainControl

Target peak audio level, in -dB,
to maintain a peak of -9dB, configure a value of 9

---

### agcTargetLevelDbfs

• `Optional` **agcTargetLevelDbfs**: number

_Defined in [src/types.ts:165](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L165)_

**`advanced`**

Android-only for AcousticGainControl

Dynamic range compression rate, in dBFS

## NLUConfig

### modelPath

• **modelPath**: string

_Defined in [src/types.ts:172](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L172)_

String filesystem path to NLU model

---

### metadataPath

• **metadataPath**: string

_Defined in [src/types.ts:176](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L176)_

String filesystem path to NLU metadata

---

### vocabPath

• **vocabPath**: string

_Defined in [src/types.ts:180](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L180)_

String filesystem path to NLU vocab

---

### inputLength

• `Optional` **inputLength**: number

_Defined in [src/types.ts:190](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L190)_

**`advanced`**

Android-only

Padded length of the model's input sequences.
Defaults to 128 and should only be changed if this parameter
is explicitly set to a different value at training time.

## WakewordConfig

### filterPath

• **filterPath**: string

_Defined in [src/types.ts:199](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L199)_

File system path to the "filter" Tensorflow-Lite model,
which is used to calculate a mel spectrogram frame from the linear STFT;
its inputs should be shaped [fft-width], and its outputs [mel-width]

---

### detectPath

• **detectPath**: string

_Defined in [src/types.ts:206](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L206)_

File system path to the "encode" Tensorflow-Lite model,
which is used to perform each autoregressive step over the mel frames;
its inputs should be shaped [mel-length, mel-width], and its outputs [encode-width],
with an additional state input/output shaped [state-width]

---

### encodePath

• **encodePath**: string

_Defined in [src/types.ts:212](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L212)_

File system path to the "detect" Tensorflow-Lite model;
its inputs should be shaped [encode-length, encode-width],
and its outputs

---

### activeMax

• `Optional` **activeMax**: number

_Defined in [src/types.ts:222](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L222)_

The maximum length of an activation, in milliseconds,
used to time out the activation

---

### activeMin

• `Optional` **activeMin**: number

_Defined in [src/types.ts:217](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L217)_

The minimum length of an activation, in milliseconds,
used to ignore a VAD deactivation after the wakeword

---

### encodeLength

• `Optional` **encodeLength**: number

_Defined in [src/types.ts:250](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L250)_

**`advanced`**

The length of the sliding window of encoder output
used as an input to the classifier, in milliseconds

---

### encodeWidth

• `Optional` **encodeWidth**: number

_Defined in [src/types.ts:256](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L256)_

**`advanced`**

The size of the encoder output, in vector units

---

### fftHopLength

• `Optional` **fftHopLength**: number

_Defined in [src/types.ts:300](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L300)_

**`advanced`**

The length of time to skip each time the
overlapping STFT is calculated, in milliseconds

---

### fftWindowSize

• `Optional` **fftWindowSize**: number

_Defined in [src/types.ts:284](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L284)_

**`advanced`**

The size of the signal window used to calculate the STFT,
in number of samples - should be a power of 2 for maximum efficiency

---

### fftWindowType

• `Optional` **fftWindowType**: string

_Defined in [src/types.ts:293](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L293)_

**`advanced`**

Android-only

The name of the windowing function to apply to each audio frame
before calculating the STFT; currently the "hann" window is supported

---

### melFrameLength

• `Optional` **melFrameLength**: number

_Defined in [src/types.ts:314](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L314)_

**`advanced`**

The length of time to skip each time the
overlapping STFT is calculated, in milliseconds

---

### melFrameWidth

• `Optional` **melFrameWidth**: number

_Defined in [src/types.ts:321](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L321)_

**`advanced`**

The size of each mel spectrogram frame,
in number of filterbank components

---

### preEmphasis

• `Optional` **preEmphasis**: number

_Defined in [src/types.ts:307](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L307)_

**`advanced`**

The pre-emphasis filter weight to apply to
the normalized audio signal (0 for no pre-emphasis)

---

### requestTimeout

• `Optional` **requestTimeout**: number

_Defined in [src/types.ts:236](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L236)_

iOS-only

Length of time to allow an Apple ASR request to run, in milliseconds.
Apple has an undocumented limit of 60000ms per request.

---

### rmsAlpha

• `Optional` **rmsAlpha**: number

_Defined in [src/types.ts:277](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L277)_

**`advanced`**

The Exponentially-Weighted Moving Average (EWMA) update
rate for the current RMS signal energy (0 for no RMS normalization)

---

### rmsTarget

• `Optional` **rmsTarget**: number

_Defined in [src/types.ts:270](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L270)_

**`advanced`**

The desired linear Root Mean Squared (RMS) signal energy,
which is used for signal normalization and should be tuned
to the RMS target used during training

---

### stateWidth

• `Optional` **stateWidth**: number

_Defined in [src/types.ts:262](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L262)_

**`advanced`**

The size of the encoder state, in vector units (defaults to wake-encode-width)

---

### threshold

• `Optional` **threshold**: number

_Defined in [src/types.ts:243](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L243)_

**`advanced`**

The threshold of the classifier's posterior output,
above which the trigger activates the pipeline, in the range [0, 1]

---

### wakewords

• `Optional` **wakewords**: string

_Defined in [src/types.ts:229](https://github.com/spokestack/react-native-spokestack/blob/fc770f4/src/types.ts#L229)_

iOS-only

A comma-separated list of wakeword keywords
Only necessary when not passing the filter, detect, and encode paths.

---

## License

Apache-2.0

Copyright 2020 Spokestack
