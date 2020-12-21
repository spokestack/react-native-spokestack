import { Button, StyleSheet, Text, View } from 'react-native'
import Spokestack, {
  SpokestackPlayEvent,
  SpokestackRecognizeEvent
} from 'react-native-spokestack'

import React from 'react'
import checkPermission from './checkPermission'

const noTranscriptMessage =
  'Press the "Listen" button and speak to record a message for speech playback'

export default function App() {
  const [listening, setListening] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [transcript, setTranscript] = React.useState('')
  const [partial, setPartial] = React.useState('')
  const [error, setError] = React.useState('')

  async function init() {
    const clientId = process.env.SPOKESTACK_CLIENT_ID
    const clientSecret = process.env.SPOKESTACK_CLIENT_SECRET

    if (!clientId) {
      throw new Error('SPOKESTACK_CLIENT_ID should be set in the environment.')
    }
    if (!clientSecret) {
      throw new Error(
        'SPOKESTACK_CLIENT_SECRET should be set in the environment.'
      )
    }
    if (!(await checkPermission())) {
      setError('Microphone permission is required.')
      return
    }
    Spokestack.initialize(clientId, clientSecret, {
      wakeword: {
        filter: require('../models/filter.tflite'),
        detect: require('../models/detect.tflite'),
        encode: require('../models/encode.tflite')
      }
    })
      .then(Spokestack.start)
      .then(async () => {
        console.log(`Initialized: ${await Spokestack.isInitialized()}`)
        console.log(`Started: ${await Spokestack.isStarted()}`)
        console.log(`Activated: ${await Spokestack.isActivated()}`)
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  React.useEffect(() => {
    Spokestack.addEventListener('activate', () => setListening(true))
    Spokestack.addEventListener('deactivate', () => setListening(false))
    Spokestack.addEventListener(
      'recognize',
      ({ transcript }: SpokestackRecognizeEvent) => setTranscript(transcript)
    )
    Spokestack.addEventListener(
      'partial_recognize',
      ({ transcript }: SpokestackRecognizeEvent) => setPartial(transcript)
    )
    Spokestack.addEventListener('play', ({ playing }: SpokestackPlayEvent) =>
      setPlaying(playing)
    )

    init()

    return () => {
      Spokestack.removeAllListeners()
    }
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button
          title={listening ? 'Listening...' : 'Listen'}
          onPress={async () => {
            if (listening) {
              Spokestack.deactivate()
            } else {
              Spokestack.activate()
            }
          }}
          color="#2f5bea"
        />
        <Button
          title={playing ? 'Playing...' : `Play transcript`}
          onPress={() => {
            Spokestack.speak(transcript || noTranscriptMessage)
          }}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.results}>
        <Text style={styles.transcript}>Transcript</Text>
        <Text>Partial: "{partial}"</Text>
        <Text>Completed: "{transcript}"</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  error: {
    color: 'red',
    padding: 20
  },
  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },
  results: {
    width: '100%',
    height: 50,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  transcript: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10
  }
})
