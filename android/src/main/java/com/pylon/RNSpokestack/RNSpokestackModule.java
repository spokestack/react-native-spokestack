
package com.pylon.RNSpokestack;

import io.spokestack.spokestack.SpeechPipeline;
import io.spokestack.spokestack.SpeechContext;
import io.spokestack.spokestack.OnSpeechEventListener;

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

public class RNSpokestackModule extends ReactContextBaseJavaModule implements OnSpeechEventListener {

  private final ReactApplicationContext reactContext;
  private SpeechPipeline pipeline;

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
  public void initialize(ReadableMap config) {
    assert config.hasKey("input") : "'input' key is required in config";
    assert config.hasKey("stages") : "'stages' key is required in config";

    final SpeechPipeline.Builder builder = new SpeechPipeline.Builder();
    builder.setInputClass(config.getString("input"));

    for (Object stage : config.getArray("stages").toArrayList()) {
      builder.addStageClass(stage.toString());
    }

    if (config.hasKey("properties")) {
      Map<String, Object> map = config.getMap("properties").toHashMap();
      for (String k: map.keySet())
        builder.setProperty(k, map.get(k));
    }
    builder.addOnSpeechEventListener(this);

    pipeline = builder.build();
    onEvent("init", pipeline.getContext().isActive());
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
    pipeline.getContext().setActive(true);
    pipeline.getContext().dispatch(SpeechContext.Event.ACTIVATE);
  }

  @ReactMethod
  public void deactivate () {
    pipeline.getContext().setActive(false);
    pipeline.getContext().dispatch(SpeechContext.Event.DEACTIVATE);
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
}
