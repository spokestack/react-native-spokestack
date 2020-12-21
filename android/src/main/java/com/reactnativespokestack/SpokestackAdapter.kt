package com.reactnativespokestack

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import io.spokestack.spokestack.SpeechContext
import io.spokestack.spokestack.SpokestackModule
import io.spokestack.spokestack.nlu.NLUResult
import io.spokestack.spokestack.tts.TTSEvent

class SpokestackAdapter(sendFunc:(event: String, data: WritableMap) -> Unit):io.spokestack.spokestack.SpokestackAdapter() {
  private val logTag = "Spokestack"
  private val sendEvent:(event: String, data: WritableMap) -> Unit = sendFunc

  override fun error(module: SpokestackModule, err:Throwable) {
    val reactEvent = Arguments.createMap()
    reactEvent.putString("error", module.name + " " + err.localizedMessage)
    sendEvent("error", reactEvent)
  }

  override fun trace(module: SpokestackModule, message:String) {
    val reactEvent = Arguments.createMap()
    reactEvent.putString("message", module.name + " " + message)
    sendEvent("trace", reactEvent)
  }

  override fun nluResult(result: NLUResult) {
    val reactEvent = Arguments.createMap()
    reactEvent.putString("intent", result.intent)
    reactEvent.putString("confidence", result.confidence.toString())

    // Slots is an array of slots, not a map
    val slots = Arguments.createArray()
    for ((_, slot) in result.slots) {
      val slotMap = Arguments.createMap()
      slotMap.putString("type", slot.type)
      slotMap.putString("rawValue", slot.rawValue.toString())
      when (slot.value) {
        is Boolean -> slotMap.putBoolean("value", slot.value as Boolean)
        is Int -> slotMap.putInt("value", slot.value as Int)
        is Double -> slotMap.putDouble("value", slot.value as Double)
        null -> slotMap.putNull("value")
        else -> slotMap.putString("value", slot.value.toString())
      }
      slots.pushMap(slotMap)
    }
    reactEvent.putArray("slots", slots)
    sendEvent("classify", reactEvent)
  }

  override fun ttsEvent(event: TTSEvent) {
    val reactEvent = Arguments.createMap()
    when (event.type) {
      TTSEvent.Type.AUDIO_AVAILABLE -> {
        reactEvent.putString("url", event.ttsResponse.audioUri.toString())
        sendEvent("synthesize", reactEvent)
      }
      TTSEvent.Type.PLAYBACK_STARTED -> {
        reactEvent.putBoolean("playing", true)
        sendEvent("play", reactEvent)
      }
      TTSEvent.Type.PLAYBACK_STOPPED -> {
        reactEvent.putBoolean("playing", false)
        sendEvent("play", reactEvent)
      }
      TTSEvent.Type.PLAYBACK_COMPLETE -> {
        // Playback is not pause-able in iOS
        // so this event does not exist there.
        Log.d(logTag, "Playback has completed")
      }
      TTSEvent.Type.ERROR -> {
        reactEvent.putString("error", "TTS error: " + event.error.localizedMessage)
        sendEvent("error", reactEvent)
      }
      null -> Log.d(logTag, "TTSEvent received with null type")
    }
  }

  override fun speechEvent(event: SpeechContext.Event, context: SpeechContext) {
    val reactEvent = Arguments.createMap()
    when (event) {
      SpeechContext.Event.RECOGNIZE -> {
        reactEvent.putString("transcript", context.transcript)
        sendEvent(event.name, reactEvent)
      }
      SpeechContext.Event.PARTIAL_RECOGNIZE -> {
        reactEvent.putString("transcript", context.transcript)
        sendEvent(event.name, reactEvent)
      }
      SpeechContext.Event.ACTIVATE -> {
        reactEvent.putString("transcript", "")
        sendEvent(event.name, reactEvent)
      }
      SpeechContext.Event.DEACTIVATE -> {
        reactEvent.putString("transcript", "")
        sendEvent(event.name, reactEvent)
      }
      SpeechContext.Event.TIMEOUT -> {
        reactEvent.putString("transcript", "")
        sendEvent(event.name, reactEvent)
      }
      SpeechContext.Event.ERROR -> {
        reactEvent.putString("error", context.error.message)
        sendEvent(event.name, reactEvent)
      }
      else -> Log.d(logTag, "Native event received (${event.name}) but not sending JS event.")
    }
  }
}
