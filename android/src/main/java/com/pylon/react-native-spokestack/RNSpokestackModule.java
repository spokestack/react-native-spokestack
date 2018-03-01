
package com.pylon.react-native-spokestack;

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
      case context.ACTIVATE:
          onSpeechStart();
          break;
      case context.DEACTIVATE:
          onSpeechEnd();
          break;
      case context.RECOGNIZE:
          onSpeechResults(context.getTranscript());
          break;
      default:
          WritableMap event = Arguments.createMap();
          event.putBoolean("error", true);
          sendEvent("unrecognizedEvent", event);
          break;
      }
  }

  public void onSpeechError(String errorMessage) {
      //String errorMessage = getErrorText(errorCode);
      WritableMap event = Arguments.createMap();
      event.putString("error", errorMessage);
      sendEvent("onSpeechError", event);
  }

  public void onSpeechResults(ArrayList<String> results) {
      WritableArray arr = Arguments.createArray();

      for (String result : results) {
          arr.pushString(result);
      }

      WritableMap event = Arguments.createMap();
      event.putArray("value", arr);
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
