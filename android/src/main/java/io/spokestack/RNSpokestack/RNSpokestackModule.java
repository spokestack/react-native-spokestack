
package io.spokestack.RNSpokestack;

import android.util.Log;

import io.spokestack.spokestack.SpeechPipeline;
import io.spokestack.spokestack.SpeechContext;
import io.spokestack.spokestack.OnSpeechEventListener;
import io.spokestack.spokestack.nlu.*;
import io.spokestack.spokestack.nlu.tensorflow.*;
import io.spokestack.spokestack.tts.*;
import io.spokestack.spokestack.util.*;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class RNSpokestackModule extends ReactContextBaseJavaModule implements OnSpeechEventListener, TTSListener, TraceListener, Callback<NLUResult> {

    private final ReactApplicationContext reactContext;
    private SpeechPipeline pipeline;
    private TTSManager tts;
    private NLUService nlu;

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
            builder.setAndroidContext(reactContext.getApplicationContext());
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

        // NLU
        if (config.hasKey("nlu")) {
            final TensorflowNLU.Builder nluBuilder = new TensorflowNLU.Builder();
            nluBuilder.setConfig(pipeline.getConfig());
            nluBuilder.addTraceListener(this);
            Map<String, Object> map = config.getMap("nlu").toHashMap();
            for (String k : map.keySet())
                nluBuilder.setProperty(k, map.get(k));
            nlu = nluBuilder.build();
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

    @ReactMethod
    public void classify (String utterance, ReadableMap context) {
        AsyncResult<NLUResult> asyncResult = nlu.classify(utterance, new NLUContext(this.pipeline.getConfig()));
        asyncResult.registerCallback(this);
    }

    @Override
    public void call(NLUResult arg) {
        WritableMap reactEvent = Arguments.makeNativeMap(toEvent(arg));
        sendEvent("onNLUEvent", reactEvent);
    }

    static Map<String, Object> toEvent(NLUResult nluResult) {
        Map<String, Object> eventMap = new HashMap<>();
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> slots = new HashMap<>();
        for (Map.Entry<String, Slot> entry : nluResult.getSlots().entrySet()) {
            Map<String, Object> slot = new HashMap<>();
            Slot s = entry.getValue();
            slot.put("type", s.getType());
            Object val = s.getValue();
            Object value = isPrimitive(val) ? val : val.toString();
            slot.put("value", value);
            slot.put("rawValue", s.getRawValue());
            slots.put(entry.getKey(), slot);
        }
        result.put("intent", nluResult.getIntent());
        result.put("confidence", Float.toString(nluResult.getConfidence()));
        result.put("slots", slots);
        eventMap.put("result", result);
        eventMap.put("event", "classification");
        return eventMap;
    }

    private static boolean isPrimitive(Object val) {
        return val == null
            || val instanceof Boolean
            || val instanceof Double
            || val instanceof Float
            || val instanceof Integer
            || val instanceof Long
            || val instanceof Short
            || val instanceof String;
    }

    @Override
    public void onError(Throwable err) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", "error");
        react_event.putString("error", err.getLocalizedMessage());
        sendEvent("onNLUEvent", react_event);
    }

    public void onEvent(SpeechContext.Event event, SpeechContext context) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", event.name());
        react_event.putString("transcript", context.getTranscript());
        react_event.putString("message", context.getMessage());
        react_event.putString("error", Log.getStackTraceString(context.getError()));
        sendEvent("onSpeechEvent", react_event);
    }

    public void onEvent(String event, Boolean active) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", event);
        react_event.putString("transcript", "");
        react_event.putString("message", "");
        react_event.putString("error", "");
        sendEvent("onSpeechEvent", react_event);
    }

    @Override
    public void onTrace(EventTracer.Level level, String message) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", "trace");
        react_event.putString("trace", message);
        react_event.putString("level", level.toString());
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
