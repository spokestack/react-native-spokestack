# react-native-spokestack example app

## Running this example

To run this app, first install dependencies...

```sh
$ npm install && npm run pods
```

Then go to https://spokestack.io/create and create a free account.
After creating an account, click "Account" to go to the account section.

Once you have an account, generate a free token in Settings -> API Credentials.

This will generate a free API key to use for TTS, which uses the sample voice by default.

Set these variables in your environment...

```sh
export SPOKESTACK_CLIENT_ID=$CLIENT_IDENTITY
export SPOKESTACK_CLIENT_SECRET=$CLIENT_SECRET_KEY
```

Now that you have tokens in place, the app can be run as normal.

Start the packager in a new terminal (to make sure the env vars are there):

```sh
$ npm run dev
```

Run the app on iOS or Android. Note that a real device is needed on Android for the mic to work.

See [React Native's instructions](https://reactnative.dev/docs/running-on-device) for setting up a real device.

```sh
$ npm run ios
# or
$ npm run android
```
