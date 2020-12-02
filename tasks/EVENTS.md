## Events

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
