# Events

Use `addEventListener()`, `removeEventListener()`, and `removeAllListeners()` to add and remove events handlers. All events are available in both iOS and Android.

| Name              |           Data           |                                                                                                Description |
| :---------------- | :----------------------: | ---------------------------------------------------------------------------------------------------------: |
| recognize         | `{ transcript: string }` |                                                  Fired whenever speech recognition completes successfully. |
| partial_recognize | `{ transcript: string }` |                                           Fired whenever the transcript changes during speech recognition. |
| start             |          `null`          |                 Fired when the speech pipeline starts (which begins listening for wakeword or starts VAD). |
| stop              |          `null`          |                                                                      Fired when the speech pipeline stops. |
| activate          |          `null`          | Fired when the speech pipeline activates, either through the VAD, wakeword, or when calling `.activate()`. |
| deactivate        |          `null`          |                                                                Fired when the speech pipeline deactivates. |
| play              |  `{ playing: boolean }`  |                                      Fired when TTS playback starts and stops. See the `speak()` function. |
| timeout           |          `null`          |                                        Fired when an active pipeline times out due to lack of recognition. |
| trace             |  `{ message: string }`   |         Fired for trace messages. Verbosity is determined by the [`traceLevel`](#SpokestackConfig) option. |
| error             |   `{ error: string }`    |                                                                 Fired when there's an error in Spokestack. |

_When an error event is triggered, any existing promises are rejected._
