package io.spokestack.RNSpokestack;

import android.os.Build;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.Map;
import java.util.function.BiFunction;

import io.spokestack.spokestack.nlu.NLUResult;
import io.spokestack.spokestack.nlu.Slot;
import io.spokestack.spokestack.tts.TTSEvent;
import io.spokestack.spokestack.util.EventTracer;

public class RNSpokestackAdapter extends io.spokestack.spokestack.SpokestackAdapter {

    private BiFunction<String, WritableMap, Void> sendEvent;

    public RNSpokestackAdapter(BiFunction<String, WritableMap, Void> sendFunc) {
        sendEvent = sendFunc;
    }

    @Override
    public void onTrace(EventTracer.Level level, String message) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", "trace");
        react_event.putString("trace", message);
        react_event.putString("level", level.toString());
        sendEvent.apply("onSpeechEvent", react_event);
    }

    @Override
    public void eventReceived(TTSEvent event) {
        WritableMap react_event = Arguments.createMap();
        if (event.getError() == null) {
            react_event.putString("event", "success");
            react_event.putString("url", event.getTtsResponse().getAudioUri().toString());
            sendEvent.apply("onTTSEvent", react_event);
        } else {
            react_event.putString("event", "failure");
            react_event.putString("error", event.getError().getLocalizedMessage());
            sendEvent.apply("onErrorEvent", react_event);
        }
    }

    @Override
    public void onError(Throwable err) {
        WritableMap react_event = Arguments.createMap();
        react_event.putString("event", "error");
        react_event.putString("error", err.getLocalizedMessage());
        sendEvent.apply("onErrorEvent", react_event);
    }

    @Override
    public void call(NLUResult arg) {
        WritableMap reactEvent = Arguments.makeNativeMap(toEvent(arg));
        sendEvent.apply("onNLUEvent", reactEvent);
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
}
