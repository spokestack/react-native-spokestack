
package io.spokestack.RNSpokestack;

import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Map;

import javax.annotation.Nullable;

import androidx.annotation.RequiresApi;
import io.spokestack.spokestack.SpeechContext;
import io.spokestack.spokestack.Spokestack;
import io.spokestack.spokestack.nlu.NLUContext;
import io.spokestack.spokestack.nlu.NLUResult;
import io.spokestack.spokestack.tts.SynthesisRequest;
import io.spokestack.spokestack.tts.TTSEvent;
import io.spokestack.spokestack.util.AsyncResult;

@RequiresApi(api = Build.VERSION_CODES.N)
public class RNSpokestackModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private final RNSpokestackAdapter adapter = new RNSpokestackAdapter();
    private Spokestack spokestack;

    public RNSpokestackModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        adapter.sendEvent = this::sendEvent;
    }

    @Override
    public String getName() {
        return "RNSpokestack";
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (spokestack.getSpeechPipeline() != null && spokestack.getSpeechPipeline().isRunning()) {
            spokestack.getSpeechPipeline().stop();
        }
    }

    private Void sendEvent(String eventName, @Nullable WritableMap params) {
        if (this.reactContext.hasActiveCatalystInstance()) {
            this.reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
        return null;
    }

    @ReactMethod
    public void initialize(ReadableMap config) throws Exception {

        final Spokestack.Builder builder = new Spokestack.Builder();
        builder.addListener(this.adapter);
        builder.withAndroidContext(reactContext.getApplicationContext());

        if (config.hasKey("properties")) {
            Map<String, Object> map = config.getMap("properties").toHashMap();
            for (String k : map.keySet())
                builder.setProperty(k, map.get(k));
        }

        // SpeechPipeline
        if (config.hasKey("pipeline")) {
            Map<String, Object> map = config.getMap("pipeline").toHashMap();
            for (String k : map.keySet())
                builder.setProperty(k, map.get(k));
            Double p = Double.parseDouble(map.get("profile").toString());
            PipelineProfiles profile = PipelineProfiles.values()[p.intValue()];
            String namespacedProfile = "io.spokestack.spokestack.profile." + String.valueOf(profile);
            builder.getPipelineBuilder().useProfile(namespacedProfile);
        } else {
            builder.withoutSpeechPipeline();
            builder.withoutAutoClassification();
        }

        // NLU
        if (config.hasKey("nlu")) {
            Map<String, Object> map = config.getMap("nlu").toHashMap();
            for (String k : map.keySet())
                builder.setProperty(k, map.get(k));
        } else {
            builder.withoutNlu();
            builder.withoutAutoClassification();
        }

        // TTS is automatically built and available
        builder.withoutAutoPlayback();

        spokestack = builder.build();
        onEvent("init", spokestack.getSpeechPipeline().getContext().isActive());
    }

    private enum PipelineProfiles {
        TFWakewordAndroidASR(0),
        VADTriggerAndroidASR(1),
        PushToTalkAndroidASR(2),
        TFWakewordSpokestackASR(3),
        VADTriggerSpokestackASR(4),
        PushToTalkSpokestackASR(5);

        private final int profile;
        PipelineProfiles(int l) {
            this.profile = l;
        }

        public int value() {
            return this.profile;
        }
    }

    @ReactMethod
    public void start() throws Exception {
        spokestack.getSpeechPipeline().start();
        onEvent("start", spokestack.getSpeechPipeline().getContext().isActive());
    }

    @ReactMethod
    public void stop () {
        spokestack.getSpeechPipeline().stop();
        onEvent("stop", spokestack.getSpeechPipeline().getContext().isActive());
    }

    @ReactMethod
    public void activate () {
        spokestack.getSpeechPipeline().activate();
    }

    @ReactMethod
    public void deactivate () {
        spokestack.getSpeechPipeline().deactivate();
    }

    @ReactMethod
    public void synthesize (ReadableMap ttsInput) {
        int format = ttsInput.getInt("format");
        if (format > 2 || format < 0) {
            TTSEvent e = new TTSEvent(TTSEvent.Type.ERROR);
            Throwable t = new Throwable("A format of " + Integer.toString(format) +
                    " is not supported. Please use an int between 0 and 2. Refer to documentation for further details.");
            e.setError(t);
            adapter.eventReceived(e);
        } else {
            SynthesisRequest req = new SynthesisRequest.Builder(ttsInput.getString("input"))
                    .withMode(SynthesisRequest.Mode.values()[format])
                    .withVoice(ttsInput.getString("voice"))
                    .build();
            spokestack.getTts().synthesize(req);
        }
    }

    @ReactMethod
    public void classify (String utterance, ReadableMap context) {
        AsyncResult<NLUResult> asyncResult = spokestack.getNlu().classify(utterance, new NLUContext(spokestack.getSpeechPipeline().getConfig()));
        asyncResult.registerCallback(adapter);
    }

    public void onEvent(SpeechContext.Event event, SpeechContext context) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", event.name());
        react_event.putString("transcript", context.getTranscript());
        react_event.putString("message", context.getMessage());
        react_event.putString("error", Log.getStackTraceString(context.getError()));
        if (react_event.getString("error").isEmpty()) {
            sendEvent("onSpeechEvent", react_event);
        } else {
            sendEvent("onErrorEvent", react_event);
        }
    }

    public void onEvent(String event, Boolean active) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", event);
        react_event.putString("transcript", "");
        react_event.putString("message", "");
        react_event.putString("error", "");
        sendEvent("onSpeechEvent", react_event);
    }
}
