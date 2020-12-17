package com.reactnativespokestack

import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import io.spokestack.spokestack.PipelineProfile
import io.spokestack.spokestack.Spokestack
import io.spokestack.spokestack.profile.*
import io.spokestack.spokestack.tts.AudioResponse
import io.spokestack.spokestack.tts.SpokestackTTSOutput
import io.spokestack.spokestack.tts.SynthesisRequest
import kotlinx.coroutines.*
import javax.annotation.Nullable

class SpokestackModule(private val reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
  private val adapter = SpokestackAdapter { event: String, data: WritableMap -> sendEvent(event, data) }
  private var spokestack: Spokestack? = null
  private val promises = mutableMapOf<SpokestackPromise, Promise>()
  private var say: ((url: String) -> Unit)? = null
  private lateinit var audioPlayer: SpokestackTTSOutput
  private lateinit var downloader: Downloader
  private val filenameToProp = mapOf(
    "filter.tflite" to "wake-filter-path",
    "detect.tflite" to "wake-detect-path",
    "encode.tflite" to "wake-encode-path",
    "nlu.tflite" to "nlu-model-path",
    "metadata.json" to "nlu-metadata-path",
    "vocab.txt" to "wordpiece-vocab-path"
  )
  private val propToFilename = filenameToProp.entries.associateBy({ it.value }, { it.key })

  override fun getName(): String {
    return "Spokestack"
  }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    if (started()) {
      spokestack?.stop()
    }
  }

  private enum class SpokestackPromise {
    SYNTHESIZE,
    SPEAK,
    CLASSIFY
  }

  private enum class PipelineProfiles(p:Class<out PipelineProfile>) {
    TFLiteWakewordNativeASR(TFWakewordAndroidASR::class.java),
    VADNativeASR(VADTriggerAndroidASR::class.java),
    PTTNativeASR(PushToTalkAndroidASR::class.java),
    TFLiteWakewordSpokestackASR(TFWakewordSpokestackASR::class.java),
    VADSpokestackASR(VADTriggerSpokestackASR::class.java),
    PTTSpokestackASR(PushToTalkSpokestackASR::class.java);
    private val profile:Class<out PipelineProfile> = p
    fun value():String {
      return this.profile.name
    }
  }

  private fun sendEvent(event:String, @Nullable params:WritableMap) {
    if (reactContext.hasActiveCatalystInstance()) {
      when(event.toLowerCase()) {
        "error" -> {
          // Reject all existing promises
          for ((key, promise) in promises) {
            promise.reject(Exception("Error in Spokestack during ${key.name}."))
          }
          promises.clear()
        }
        "synthesize" -> {
          val url = params.getString("url")
          promises[SpokestackPromise.SYNTHESIZE]?.resolve(url)
          promises.remove(SpokestackPromise.SYNTHESIZE)
          if (say != null && url != null) {
            say!!(url)
            say = null
          }
        }
        "classify" -> {
          promises[SpokestackPromise.CLASSIFY]?.resolve(params.getMap("result"))
          promises.remove(SpokestackPromise.CLASSIFY)
        }
        else -> Log.d(name, "Sending JS event: $event")
      }
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(event.toLowerCase(), params)
    }
  }

  private fun kebabCase(str: String): String {
    return str.replace(Regex("([a-z])([A-Z])")) {
      m -> "${m.groupValues[1]}-${m.groupValues[2].toLowerCase()}"
    }
  }

  private fun textToSpeech(input: String, format: Int, voice: String) {
    if (format > 2 || format < 0) {
      throw Exception(("A format of $format is not supported. Please use an int from 0 to 2 (or use the TTSFormat enum). Refer to documentation for further details."))
    }
    val req = SynthesisRequest.Builder(input)
      .withMode(SynthesisRequest.Mode.values()[format])
      .withVoice(voice)
      .build()
    spokestack?.synthesize(req)
  }

  private fun initialized(): Boolean {
    return spokestack != null
  }

  private fun started(): Boolean {
    return initialized() && spokestack?.speechPipeline?.isRunning ?: false
  }

  private fun activated(): Boolean {
    return started() && spokestack?.speechPipeline?.context?.isActive ?: false
  }

  @ReactMethod
  fun initialize(clientId: String, clientSecret: String, config: ReadableMap, promise: Promise) = runBlocking(Dispatchers.Default) {
    if (clientId.isEmpty() || clientSecret.isEmpty()) {
      val e = IllegalArgumentException("Client ID and Client Secret are required to initialize Spokestack")
      promise.reject(e)
      return@runBlocking
    }
    val builder = Spokestack.Builder()
    builder.addListener(adapter)
    builder.withAndroidContext(reactContext.applicationContext)
    builder.setProperty("spokestack-id", clientId)
    builder.setProperty("spokestack-secret", clientSecret)

    downloader = Downloader(
      reactContext.applicationContext,
      if (config.hasKey("allowCellular")) config.getBoolean("allowCellular") else false,
      if (config.hasKey("refreshModels")) config.getBoolean("refreshModels") else false
    )

    // Top-level config
    if (config.hasKey("traceLevel")) {
      builder.setProperty("trace-level", config.getInt("traceLevel"))
    }
    // SpeechPipeline
    // Default to PTT
    builder.pipelineBuilder.useProfile(PipelineProfiles.PTTNativeASR.value())
    if (config.hasKey("pipeline")) {
      val map = config.getMap("pipeline")?.toHashMap()
      if (map != null) {
        for (key in map.keys) {
          // JS uses camelCase for keys
          // Convert to kebab-case
          builder.setProperty(kebabCase(key), map[key])
        }
        if (map.containsKey("profile")) {
          val profile = PipelineProfiles.values()[(map["profile"] as Double).toInt()]
          builder.pipelineBuilder.useProfile(profile.value())
        }
      }
    }
    // Wakeword
    val wakeDownloads = mutableMapOf<String, String>()
    if (config.hasKey("wakeword")) {
      val map = config.getMap("wakeword")?.toHashMap()
      if (map != null) {
        for (key in map.keys) {
          // Map JS keys to Android keys
          when (key) {
            "filter" -> {
              wakeDownloads[propToFilename["wake-filter-path"] as String] = map[key] as String
            }
            "detect" -> {
              wakeDownloads[propToFilename["wake-detect-path"] as String] = map[key] as String
            }
            "encode" -> {
              wakeDownloads[propToFilename["wake-encode-path"] as String] = map[key] as String
            }
            "activeMin" -> builder.setProperty("wake-active-min", map[key])
            "activeMax" -> builder.setProperty("wake-active-max", map[key])
            "encodeLength" -> builder.setProperty("wake-encode-length", map[key])
            "encodeWidth" -> builder.setProperty("wake-encode-width", map[key])
            "stateWidth" -> builder.setProperty("wake-state-width", map[key])
            "threshold" -> builder.setProperty("wake-threshold", map[key])
            else -> builder.setProperty(kebabCase(key), map[key])
          }
        }
      }
    }

    // Wakeword needs all three config paths
    if (wakeDownloads.size == 3) {
      Log.d(name, "Building with wakeword.")
      downloader.downloadAll(wakeDownloads).forEach { (filename, loc) ->
        builder.setProperty(filenameToProp[filename], loc)
      }
    } else {
      Log.d(name, "Not enough wakeword config files. Building without wakeword.")
      builder.withoutWakeword()
    }

    // NLU
    val nluDownloads = mutableMapOf<String, String>()
    if (config.hasKey("nlu")) {
      val map = config.getMap("nlu")?.toHashMap()
      if (map != null) {
        for (key in map.keys) {
          // Map JS keys to Android keys
          when (key) {
            "model" -> {
              nluDownloads[propToFilename["nlu-model-path"] as String] = map[key] as String
            }
            "metadata" -> {
              nluDownloads[propToFilename["nlu-metadata-path"] as String] = map[key] as String
            }
            "vocab" -> {
              nluDownloads[propToFilename["wordpiece-vocab-path"] as String] = map[key] as String
            }
            "inputLength" -> builder.setProperty("nlu-input-length", map[key])
          }
        }
      }
    }

    if (nluDownloads.size == 3) {
      Log.d(name, "Building with NLU.")
      downloader.downloadAll(nluDownloads).forEach { (filename, loc) ->
        builder.setProperty(filenameToProp[filename], loc)
      }
    } else {
      Log.d(name, "Not enough NLU config files. Building without NLU.")
      builder.withoutNlu()
    }

    // TTS is automatically built and available
    builder.withoutAutoPlayback()

    // Initialize the audio player for speaking
    audioPlayer = SpokestackTTSOutput(null)
    audioPlayer.setAndroidContext(reactContext.applicationContext)
    audioPlayer.addListener(adapter)

    spokestack = builder.build()
    promise.resolve(null)
  }

  @ReactMethod
  fun start(promise: Promise) {
    if (!initialized()) {
      promise.reject(Exception("Call Spokestack.initialize() before starting the speech pipeline."))
      return
    }
    try {
      spokestack?.start()
      promise.resolve(null)

      // Send a start event for parity with iOS
      val reactEvent = Arguments.createMap()
      reactEvent.putString("transcript", "")
      sendEvent("start", reactEvent)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      spokestack?.stop()
      promise.resolve(null)

      // Send a stop event for parity with iOS
      val reactEvent = Arguments.createMap()
      reactEvent.putString("transcript", "")
      sendEvent("stop", reactEvent)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun activate(promise: Promise) {
    if (!initialized()) {
      promise.reject(Exception("Call Spokestack.initialize() and then Spokestack.start() to start the speech pipeline before calling Spokestack.activate()."))
      return
    }
    if (!started()) {
      promise.reject(Exception("The speech pipeline is not yet running. Call Spokestack.start() before calling Spokestack.activate()."))
      return
    }
    try {
      spokestack?.activate()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun deactivate(promise: Promise) {
    try {
      spokestack?.deactivate()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun synthesize(input: String, format: Int, voice: String, promise: Promise) {
    promises[SpokestackPromise.SYNTHESIZE] = promise
    try {
      textToSpeech(input, format, voice)
    } catch (e: Exception) {
      promise.reject(e)
      promises.remove(SpokestackPromise.SYNTHESIZE)
    }
  }

  @ReactMethod
  fun speak(input: String, format: Int, voice: String, promise: Promise) {
    promises[SpokestackPromise.SPEAK] = promise
    say = { url ->
      Log.d(name,"Playing audio from URL: $url")
      val uri = Uri.parse(url)
      val response = AudioResponse(uri)
      audioPlayer.audioReceived(response)

      /* TODO: Change this to a playback started listener when spokestack-android supports it. */
      val reactEvent = Arguments.createMap()
      reactEvent.putBoolean("playing", true)
      sendEvent("play", reactEvent)

      // Resolve RN promise
      promise.resolve(null)
      promises.remove(SpokestackPromise.SPEAK)
    }
    try {
      textToSpeech(input, format, voice)
    } catch (e: Exception) {
      promise.reject(e)
      promises.remove(SpokestackPromise.SPEAK)
    }
  }

  @ReactMethod
  fun classify(utterance:String, promise: Promise) {
    promises[SpokestackPromise.CLASSIFY] = promise
    spokestack?.classify(utterance)
  }

  @ReactMethod
  fun isInitialized(promise: Promise) {
    promise.resolve(initialized())
  }

  @ReactMethod
  fun isStarted(promise: Promise) {
    promise.resolve(started())
  }

  @ReactMethod
  fun isActivated(promise: Promise) {
    promise.resolve(activated())
  }
}
