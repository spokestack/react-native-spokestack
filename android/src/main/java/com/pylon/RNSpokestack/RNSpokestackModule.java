
package com.pylon.RNSpokestack;

import com.pylon.spokestack.SpeechContext;

import android.os.Bundle;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import java.util.ArrayList;
import javax.annotation.Nullable;

public class RNSpokestackModule extends ReactContextBaseJavaModule implements SpeechContext.OnSpeechEventListener {

  private final ReactApplicationContext reactContext;

  public RNSpokestackModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
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

  @Override
  public void onEvent(SpeechContext.Event event, SpeechContext context) {
      switch (event) {
      case ACTIVATE:
          onSpeechStart();
          break;
      case DEACTIVATE:
          onSpeechEnd();
          break;
      case RECOGNIZE:
          onSpeechResults(context.getTranscript());
          break;
      default:
          WritableMap response = Arguments.createMap();
          response.putBoolean("error", true);
          sendEvent("unrecognizedEvent", response);
          break;
      }
  }

  public void onSpeechError(String errorMessage) {
      //String errorMessage = getErrorText(errorCode);
      WritableMap event = Arguments.createMap();
      event.putString("error", errorMessage);
      sendEvent("onSpeechError", event);
  }

  public void onSpeechResults(String results) {
      WritableMap event = Arguments.createMap();
      event.putString("value", results);
      sendEvent("onSpeechResults", event);
  }

  public void onSpeechStart() {
      WritableMap event = Arguments.createMap();
      event.putBoolean("error", false);
      sendEvent("onSpeechStart", event);
  }

  public void onSpeechEnd() {
      WritableMap event = Arguments.createMap();
      event.putBoolean("error", false);
      sendEvent("onSpeechEnd", event);
  }

}
