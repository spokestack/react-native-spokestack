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
  const [error, setError] = React.useState('')

  function onActivate() {
    console.log('Activated')
    setListening(true)
  }
  function onDeactivate() {
    console.log('Deactivated')
    setListening(false)
  }
  function onTimeout() {
    console.log('Timeout')
    setListening(false)
  }
  function onPlay({ playing }: SpokestackPlayEvent) {
    setPlaying(playing)
  }
  function onRecognize({ transcript }: SpokestackRecognizeEvent) {
    setTranscript(transcript)
  }

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
    Spokestack.addEventListener('activate', onActivate)
    Spokestack.addEventListener('deactivate', onDeactivate)
    Spokestack.addEventListener('timeout', onTimeout)
    Spokestack.addEventListener('recognize', onRecognize)
    Spokestack.addEventListener('play', onPlay)

    init()

    return () => {
      Spokestack.removeEventListener('activate', onActivate)
      Spokestack.removeEventListener('deactivate', onDeactivate)
      Spokestack.removeEventListener('timeout', onTimeout)
      Spokestack.removeEventListener('recognize', onRecognize)
      Spokestack.removeEventListener('play', onPlay)
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
      <Text>Transcript: "{transcript}"</Text>
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
  error: {
    color: 'red',
    padding: 20
  }
})
