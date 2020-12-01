### Events

All events are available in iOS and Android.

| Name       |           Data           |                                                                   Description |
| :--------- | :----------------------: | ----------------------------------------------------------------------------: |
| recognize  | `{ transcript: string }` |                                          Fired whenever speech is recognized. |
| timeout    |          `null`          |        Fired when an activated timeline times out due to lack of recognition. |
| activate   |          `null`          | Fired when the speech pipeline activates, either through the VAD or manually. |
| deactivate |          `null`          |                                   Fired when the speech pipeline deactivates. |
| play       |  `{ playing: boolean }`  |             Fired when playback starts and stops. See the `speak()` function. |
| error      |   `{ error: string }`    |                                    Fired when there's an error in Spokestack. |
