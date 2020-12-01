package com.reactnativespokestack

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.util.HashMap
import io.spokestack.spokestack.SpeechContext
import io.spokestack.spokestack.SpokestackModule
import io.spokestack.spokestack.nlu.NLUResult
import io.spokestack.spokestack.tts.TTSEvent

class SpokestackAdapter(sendFunc:(event: String, data: WritableMap) -> Unit):io.spokestack.spokestack.SpokestackAdapter() {
  private val sendEvent:(event: String, data: WritableMap) -> Unit = sendFunc

  override fun error(module:SpokestackModule, err:Throwable) {
    val reactEvent = Arguments.createMap()
    reactEvent.putString("error", module.name + " " + err.localizedMessage)
    sendEvent("error", reactEvent)
  }

  override fun trace(module:SpokestackModule, message:String) {
    val reactEvent = Arguments.createMap()
    reactEvent.putString("trace", module.name + " " + message)
    sendEvent("trace", reactEvent)
  }

  override fun nluResult(result:NLUResult) {
    val reactEvent = Arguments.makeNativeMap(toEvent(result))
    sendEvent("classify", reactEvent)
  }

  override fun ttsEvent(event:TTSEvent) {
    val reactEvent = Arguments.createMap()
    if (event.error == null) {
      reactEvent.putString("url", event.ttsResponse.audioUri.toString())
      sendEvent("synthesize", reactEvent)
    }
  }

  override fun speechEvent(event:SpeechContext.Event, context:SpeechContext) {
    val reactEvent = Arguments.createMap()
    when (event) {
      SpeechContext.Event.RECOGNIZE -> {
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
    }
  }

  companion object {
    internal fun toEvent(nluResult:NLUResult):Map<String, Any> {
      val eventMap = HashMap<String, Any>()
      val result = HashMap<String, Any>()
      val slots = HashMap<String, Any>()
      for (entry in nluResult.slots) {
        val slot = HashMap<String, Any>()
        val s = entry.value
        slot["type"] = s.type
        var value = s.value
        value = if (isPrimitive(value)) value else value.toString()
        slot["value"] = value
        slot["rawValue"] = s.rawValue
        slots[entry.key] = slot
      }
      result["intent"] = nluResult.intent
      result["confidence"] = nluResult.confidence.toString()
      result["slots"] = slots
      eventMap["result"] = result
      return eventMap
    }

    private fun isPrimitive(value: Any?): Boolean {
      return (value == null
        || value is Boolean
        || value is Double
        || value is Float
        || value is Int
        || value is Long
        || value is Short
        || value is String)
    }
  }
}
