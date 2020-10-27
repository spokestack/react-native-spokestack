
package io.spokestack.RNSpokestack;

import android.os.Build;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Map;

import javax.annotation.Nullable;

import io.spokestack.spokestack.PipelineProfile;
import io.spokestack.spokestack.Spokestack;
import io.spokestack.spokestack.profile.PushToTalkAndroidASR;
import io.spokestack.spokestack.profile.PushToTalkSpokestackASR;
import io.spokestack.spokestack.profile.TFWakewordAndroidASR;
import io.spokestack.spokestack.profile.TFWakewordSpokestackASR;
import io.spokestack.spokestack.profile.VADTriggerAndroidASR;
import io.spokestack.spokestack.profile.VADTriggerSpokestackASR;
import io.spokestack.spokestack.tts.SynthesisRequest;
import io.spokestack.spokestack.tts.TTSEvent;

public class RNSpokestackModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private final RNSpokestackAdapter adapter = new RNSpokestackAdapter(this::sendEvent);
    private Spokestack spokestack;

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
        if (spokestack.getSpeechPipeline() != null) {
            spokestack.stop();
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
            if (map.containsKey("profile")) {
                Double p = Double.parseDouble(map.get("profile").toString());
                PipelineProfiles profile = PipelineProfiles.values()[p.intValue()];
                builder.getPipelineBuilder().useProfile(profile.value());
            }
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
    }

    private enum PipelineProfiles {
        TFLiteWakewordNativeASR(TFWakewordAndroidASR.class),
        VADNativeASR(VADTriggerAndroidASR.class),
        PTTNativeASR(PushToTalkAndroidASR.class),
        TFLiteWakewordSpokestackASR(TFWakewordSpokestackASR.class),
        VADSpokestackASR(VADTriggerSpokestackASR.class),
        PTTSpokestackASR(PushToTalkSpokestackASR.class);

        private final Class<? extends PipelineProfile> profile;
        PipelineProfiles(Class<? extends PipelineProfile> p) {
            this.profile = p;
        }

        public String value() {
            return this.profile.getCanonicalName();
        }
    }

    @ReactMethod
    public void start() throws Exception {
        spokestack.getSpeechPipeline().start();
    }

    @ReactMethod
    public void stop () {
        spokestack.getSpeechPipeline().stop();
    }

    @ReactMethod
    public void activate () {
        spokestack.activate();
    }

    @ReactMethod
    public void deactivate () {
        spokestack.deactivate();
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
            spokestack.synthesize(req);
        }
    }

    @ReactMethod
    public void classify (String utterance, ReadableMap context) {
        spokestack.classify(utterance);
    }
}
