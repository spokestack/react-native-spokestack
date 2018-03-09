
package com.pylon.RNSpokestack;

import com.pylon.spokestack.SpeechPipeline;
import com.pylon.spokestack.SpeechContext;
import com.pylon.spokestack.OnSpeechEventListener;

import android.os.Bundle;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import java.util.ArrayList;
import javax.annotation.Nullable;

public class RNSpokestackModule extends ReactContextBaseJavaModule implements OnSpeechEventListener {

  private final ReactApplicationContext reactContext;
  private SpeechContext.Event event;
  private SpeechPipeline pipeline;
  private SpeechContext context;

  public RNSpokestackModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;

    pipeline = new SpeechPipeline.Builder()
      .setInputClass("com.pylon.spokestack.android.MicrophoneInput")
      .addStageClass("com.pylon.spokestack.libfvad.VADTrigger")
      .setProperty("sample-rate", 16000)
      .setProperty("frame-width", 20)
      .setProperty("buffer-width", 300)
      .addOnSpeechEventListener(this)
      .build();
  }

  @Override
  public String getName() {
    return "RNSpokestack";
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
      this.reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(eventName, params);
  }

  public void start() {
    pipeline.start();
  }

  public void stop() {
    pipeline.stop();
  }

  public String transcript() {
      if (context == null) {
          return "";
      } else {
          return context.getTranscript();
      }
  }

  public Boolean isActive() {
      if (context == null) {
          return false;
      } else {
          return context.isActive();
      }
  }

  public void onEvent(SpeechContext.Event event, SpeechContext context) {
      this.context = context;
      WritableMap react_event = Arguments.createMap();
      react_event.putString("event", event.name());
      sendEvent("onSpeechEvent", react_event);
  }
}
