
package com.pylon.RNSpokestack;

import io.spokestack.spokestack.SpeechConfig;
import io.spokestack.spokestack.SpeechPipeline;
import io.spokestack.spokestack.SpeechContext;
import io.spokestack.spokestack.OnSpeechEventListener;
import io.spokestack.spokestack.tts.*;

import android.util.Log;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Map;
import javax.annotation.Nullable;

public class RNSpokestackModule extends ReactContextBaseJavaModule implements OnSpeechEventListener, TTSListener {

    private final ReactApplicationContext reactContext;
    private SpeechPipeline pipeline;
    private TTSManager tts;

    public RNSpokestackModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNSpokestack";
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (pipeline != null && pipeline.isRunning()) {
            pipeline.stop();
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        if (this.reactContext.hasActiveCatalystInstance()) {
            this.reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    @ReactMethod
    public void initialize(ReadableMap config) throws Exception {

        // SpeechPipeline
        if (config.hasKey("input")) {
            // SpeechConfig
            final SpeechPipeline.Builder builder = new SpeechPipeline.Builder();
            builder.setInputClass(config.getString("input"));
            for (Object stage : config.getArray("stages").toArrayList()) {
                builder.addStageClass(stage.toString());
            }
            if (config.hasKey("properties")) {
                Map<String, Object> map = config.getMap("properties").toHashMap();
                for (String k : map.keySet())
                    builder.setProperty(k, map.get(k));
            }
            builder.addOnSpeechEventListener(this);
            pipeline = builder.build();
            onEvent("init", pipeline.getContext().isActive());
        }

        // TTS
        if (config.hasKey("tts")) {
            final TTSManager.Builder ttsBuilder = new TTSManager.Builder();
            ttsBuilder.setConfig(pipeline.getConfig());
            Map<String, Object> map = config.getMap("tts").toHashMap();
            for (String k : map.keySet())
                ttsBuilder.setProperty(k, map.get(k));

            ttsBuilder.addTTSListener(this);
            tts = ttsBuilder
                    .setTTSServiceClass(map.get("ttsServiceClass").toString())
                    .setAndroidContext(reactContext.getApplicationContext())
                    .build();
        }
    }

    @ReactMethod
    public void start() throws Exception {
        pipeline.start();
        onEvent("start", pipeline.getContext().isActive());
    }

    @ReactMethod
    public void stop () {
        pipeline.stop();
        onEvent("stop", pipeline.getContext().isActive());
    }

    @ReactMethod
    public void activate () {
        pipeline.activate();
    }

    @ReactMethod
    public void deactivate () {
        pipeline.deactivate();
    }

    @ReactMethod
    public void synthesize (ReadableMap ttsInput) {
        int format = ttsInput.getInt("format");
        if (format > 2 || format < 0) {
            TTSEvent e = new TTSEvent(TTSEvent.Type.ERROR);
            Throwable t = new Throwable("A format of " + Integer.toString(format) +
                    " is not supported. Please use an int between 0 and 2. Refer to documentation for further details.");
            e.setError(t);
            eventReceived(e);
        } else {
            SynthesisRequest req = new SynthesisRequest.Builder(ttsInput.getString("input"))
                    .withMode(SynthesisRequest.Mode.values()[format])
                    .withVoice(ttsInput.getString("voice"))
                    .build();
            tts.synthesize(req);
        }
    }

    public void onEvent(SpeechContext.Event event, SpeechContext context) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", event.name());
        react_event.putString("transcript", context.getTranscript());
        react_event.putString("message", context.getMessage());
        react_event.putString("error", Log.getStackTraceString(context.getError()));
        react_event.putBoolean("isActive", context.isActive());
        sendEvent("onSpeechEvent", react_event);
    }

    public void onEvent(String event, Boolean active) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", event);
        react_event.putString("transcript", "");
        react_event.putString("message", "");
        react_event.putString("error", "");
        react_event.putBoolean("isActive", active);
        sendEvent("onSpeechEvent", react_event);
    }

    @Override
    public void eventReceived(TTSEvent event) {
        WritableMap react_event = Arguments.createMap();
        if (event.getError() == null) {
            react_event.putString("event", "success");
            react_event.putString("url", event.getTtsResponse().getAudioUri().toString());
        } else {
            react_event.putString("event", "failure");
            react_event.putString("error" , event.getError().getLocalizedMessage());
        }
        sendEvent("onTTSEvent", react_event);
    }
}
