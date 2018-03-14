
package com.pylon.RNSpokestack;

import com.pylon.spokestack.SpeechPipeline;
import com.pylon.spokestack.SpeechContext;
import com.pylon.spokestack.OnSpeechEventListener;

import android.os.Bundle;
import android.os.Handler;
import android.util.Log;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

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
  }

  @Override
  public String getName() {
    return "Spokestack";
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
      this.reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(eventName, params);
  }

  @ReactMethod
  public void start(final Promise promise) {
    final RNSpokestackModule self = this;
    pipeline = new SpeechPipeline.Builder()
      .setInputClass("com.pylon.spokestack.android.MicrophoneInput")
      .addStageClass("com.pylon.spokestack.libfvad.VADTrigger")
      .setProperty("sample-rate", 16000)
      .setProperty("frame-width", 20)
      .setProperty("buffer-width", 300)
      .addOnSpeechEventListener(this)
      .build();
    Handler mainHandler = new Handler(this.reactContext.getMainLooper());
    mainHandler.post(new Runnable() {
        @Override
        public void run() {
          try {
            pipeline.start();
            promise.resolve(false);
          }
          catch(Exception e) {
            Log.e("spokestack.start", e.getMessage());
            promise.reject(e);
          }
        }
      });
  }

  @ReactMethod
  public void stop(final Promise promise) {
    Handler mainHandler = new Handler(this.reactContext.getMainLooper());
    mainHandler.post(new Runnable() {
        @Override
        public void run() {
          try {
            pipeline.stop();
            promise.resolve(false);
          }
          catch(Exception e) {
            promise.reject(e);
          }
        }
      });
  }

  public void onEvent(SpeechContext.Event event, SpeechContext context) {
    String transcript = "";
    boolean isActive = true;
    if (context == null) {
      isActive = false;
    } else {
      isActive = context.isActive();
      transcript = context.getTranscript();
    }
      this.context = context;
      WritableMap react_event = Arguments.createMap();
      react_event.putString("event", event.name());
      react_event.putString("transcript", transcript);
      react_event.putBoolean("isActive", isActive);
      sendEvent("onSpeechEvent", react_event);
  }
}
