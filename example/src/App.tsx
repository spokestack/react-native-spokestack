import { Button, StyleSheet, Text, View } from 'react-native'
import Spokestack, {
  SpokestackPlayEvent,
  SpokestackRecognizeEvent
} from 'react-native-spokestack'

import React from 'react'
import checkPermission from './checkPermission'

export default function App() {
  const [listening, setListening] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [transcript, setTranscript] = React.useState('')
  const [partial, setPartial] = React.useState('')
  const [error, setError] = React.useState('')

  const onActivate = () => setListening(true)
  const onDeactivate = () => setListening(false)
  const onPlay = ({ playing }: SpokestackPlayEvent) => setPlaying(playing)
  const onRecognize = ({ transcript }: SpokestackRecognizeEvent) =>
    setTranscript(transcript)
  const onRecognizePartial = ({ transcript }: SpokestackRecognizeEvent) =>
    setPartial(transcript)

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
    Spokestack.initialize(clientId, clientSecret)
      .then(Spokestack.start)
      .catch((error) => {
        setError(error.message)
      })
  }

  React.useEffect(() => {
    Spokestack.addEventListener('recognize', onRecognize)
    Spokestack.addEventListener('partial_recognize', onRecognizePartial)
    Spokestack.addEventListener('activate', onActivate)
    Spokestack.addEventListener('deactivate', onDeactivate)
    Spokestack.addEventListener('play', onPlay)

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
          title={playing ? 'Playing...' : `Play "Hello"`}
          onPress={() => {
            Spokestack.speak('Hello World')
          }}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.results}>
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
  error: {
    color: 'red',
    padding: 20
  }
})
