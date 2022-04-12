import { Button, StyleSheet, Text, View } from 'react-native'
import Spokestack, {
  SpokestackPlayEvent,
  SpokestackRecognizeEvent
} from 'react-native-spokestack'

import React, { useState, useEffect } from 'react'
import checkPermission from './checkPermission'
import handleIntent from './handleIntent'

const noTranscriptMessage = 'Press the "Listen" button and speak to record a message for speech playback'

// @ts-ignore
import { REACT_APP_SPOKESTACK_CLIENT_ID, REACT_APP_SPOKESTACK_CLIENT_SECRET } from '@env';


export default function App() {
  const [listening, setListening] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [partial, setPartial] = useState('')
  const [prompt, setPrompt] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [showKeyword, setShowKeyword] = useState(true)
  const [error, setError] = useState('')

  async function init() {
    const clientId: string = REACT_APP_SPOKESTACK_CLIENT_ID
    const clientSecret: string = REACT_APP_SPOKESTACK_CLIENT_SECRET

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
    // Reset state
    setListening(false)
    setPlaying(false)
    setTranscript('')
    setPartial('')
    setPrompt('')
    setError('')
    // This example app demonstrates both ways
    // to pass model files, but we recommend using one or the other.
    setInitializing(true)
    try {
      if (showKeyword) {
        await Spokestack.initialize(clientId, clientSecret, {
          allowCellularDownloads: true,
          wakeword: {
            detect: require('../models/detect.tflite'),
            encode: require('../models/encode.tflite'),
            filter: require('../models/filter.tflite')
          },
          keyword: {
            detect: require('../models/keyword_detect.tflite'),
            encode: require('../models/keyword_encode.tflite'),
            filter: require('../models/keyword_filter.tflite'),
            metadata: require('../models/keyword_metadata.sjson')
            // Can pass either metadata or classes, which would look like this:
            // classes: [
            //   'zero',
            //   'one',
            //   'two',
            //   'three',
            //   'four',
            //   'five',
            //   'six',
            //   'seven',
            //   'eight',
            //   'nine'
            // ]
          }
        })
      } else {
        await Spokestack.initialize(clientId, clientSecret, {
          allowCellularDownloads: true,
          wakeword: {
            detect: require('../models/detect.tflite'),
            encode: require('../models/encode.tflite'),
            filter: require('../models/filter.tflite')
          },
          nlu: {
            model: 'https://s.spokestack.io/u/7fYxV/nlu.tflite',
            metadata: require('../models/metadata.sjson'),
            vocab: require('../models/vocab.txt')
          }
        })
      }
    } catch (e) {
      console.error(e)
      // @ts-ignore
      setError(e.message)
      setInitializing(false)
      return
    }
    Spokestack.addEventListener('activate', () => setListening(true))
    Spokestack.addEventListener('deactivate', () => setListening(false))
    Spokestack.addEventListener('play', ({ playing }: SpokestackPlayEvent) =>
      setPlaying(playing)
    )
    Spokestack.addEventListener(
      'recognize',
      async ({ transcript }: SpokestackRecognizeEvent) => {
        setTranscript(transcript)
        if (showKeyword) {
          const prompt = `I heard you say ${transcript}.`
          await Spokestack.speak(prompt)
          setPrompt(prompt)
        } else {
          const node = await Spokestack.classify(transcript)
          const next = handleIntent(node)
          await Spokestack.speak(next.prompt)
          setPrompt(next.prompt)
        }
      }
    )
    Spokestack.addEventListener(
      'partial_recognize',
      ({ transcript }: SpokestackRecognizeEvent) => setPartial(transcript)
    )
    // Spokestack.addEventListener('trace', ({ message }: SpokestackTraceEvent) =>
    //   console.log(message)
    // )
    try {
      await Spokestack.start()
      console.log(`Initialized: ${await Spokestack.isInitialized()}`)
      console.log(`Started: ${await Spokestack.isStarted()}`)
      console.log(`Activated: ${await Spokestack.isActivated()}`)
    } catch (e) {
      console.error(e)
      // @ts-ignore
      setError(e.message)
    }
    setInitializing(false)
  }

  useEffect(() => {
    init()

    return () => {
      Spokestack.destroy()
    }
  }, [showKeyword])

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button
          disabled={initializing || listening}
          title={listening ? 'Listening...' : 'Listen'}
          onPress={async () => {
            try {
              if (listening) {
                await Spokestack.deactivate()
              } else {
                await Spokestack.activate()
              }
            } catch (e) {
              console.error(e)
              // @ts-ignore
              setError(e.message)
            }
          }}
          color="#2f5bea"
        />
        <Button
          disabled={initializing || listening || playing}
          title={playing ? 'Playing...' : 'Play transcript'}
          onPress={async () => {
            try {
              await Spokestack.speak(transcript || noTranscriptMessage)
            } catch (e) {
              console.error(e)
              // @ts-ignore
              setError(e.message)
            }
          }}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.results}>
        <Text style={styles.transcript}>Transcript</Text>
        {!showKeyword && <Text>Partial: "{partial}"</Text>}
        <Text>Completed: "{transcript}"</Text>
        <Text>Prompt: "{prompt}"</Text>
      </View>
      <View>
        <Text style={styles.instructionText}>
          This example app demonstrates some of the robust features of
          react-native-spokestack.
        </Text>
        <Text style={styles.instructionText}>
          Choose between a sample NLU model for Minecraft or keyword recognition
          on digits zero through nine.
        </Text>
        <Button
          disabled={initializing}
          title={
            initializing
              ? 'Initializing...'
              : `Test ${showKeyword ? 'Wakeword & NLU' : 'Wakeword & Keyword'
              } Instead`
          }
          onPress={() => setShowKeyword(!showKeyword)}
        />
        <Text style={styles.instructionText}>
          {showKeyword
            ? 'Now testing keyword recogntion. Tap Listen (or say "Spokestack" if permission is already granted), then any number between "zero" and "nine".'
            : 'Currently testing the NLU model. Tap Listen (or say "Spokestack" if permission is already granted), then say, "How do I make a castle?"'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10
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
