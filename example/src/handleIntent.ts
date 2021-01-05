/**
 * This file is an example of how you might respond to the NLU.
 * See ../models/metadata.sjson for the list of all possible intents
 * to which the app should respond.
 */
import type { SpokestackNLUResult } from 'react-native-spokestack'

const greeting = {
  node: 'greeting',
  prompt:
    'Welcome! This example uses Minecraft sample models. Try saying, "How do I make a castle?"',
  noInterrupt: true
}

let lastNode: { node: string; prompt: string } = greeting

export default function handleIntent(result: SpokestackNLUResult) {
  switch (result.intent) {
    case 'AMAZON.RepeatIntent':
      return lastNode
    case 'AMAZON.YesIntent':
      lastNode = {
        node: 'search',
        prompt: 'I heard you say yes! What would you like to make?'
      }
      return lastNode
    case 'AMAZON.NoIntent':
      lastNode = {
        node: 'exit',
        prompt: 'I heard you say no. Goodbye.'
      }
      return lastNode
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent':
    case 'AMAZON.FallbackIntent':
      lastNode = {
        node: 'exit',
        prompt: 'Goodbye!'
      }
      return lastNode
    case 'RecipeIntent':
      lastNode = {
        node: 'recipe',
        prompt: `If I were a real app, I would show a screen now on how to make ${
          result.slots.Item ? `a ${result.slots.Item.value}` : 'something'
        }. Want to continue?`
      }
      return lastNode
    case 'AMAZON.HelpIntent':
      lastNode = {
        node: 'help',
        prompt: 'Try saying, "How do I make a castle?". To exit, say "exit".'
      }
      return lastNode
    default:
      lastNode = greeting
      return lastNode
  }
}
