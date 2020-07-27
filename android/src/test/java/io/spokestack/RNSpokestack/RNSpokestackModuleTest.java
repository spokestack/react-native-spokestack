package io.spokestack.RNSpokestack;

import io.spokestack.spokestack.nlu.NLUResult;
import io.spokestack.spokestack.nlu.Slot;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.*;

public class RNSpokestackModuleTest {

    @Test
    public void testNluEvent() {
        // no slots
        NLUResult result = new NLUResult.Builder("test")
              .withIntent("intent")
              .withConfidence(0.5f)
              .withSlots(new HashMap<>())
              .build();

        validateTranslation(result);

        // one slot
        Map<String, Slot> slots = new HashMap<>();
        Slot numSlot = new Slot("number", "one", 1);
        slots.put("number", numSlot);
        result = new NLUResult.Builder("test")
              .withIntent("intent")
              .withConfidence(0.5f)
              .withSlots(slots)
              .build();

        validateTranslation(result);

        // two slots, one null
        slots.clear();
        slots.put("number", numSlot);
        Slot nullSlot = new Slot("unrecognized", null, null);
        slots.put("unrecognized", nullSlot);
        result = new NLUResult.Builder("test")
              .withIntent("intent")
              .withConfidence(0.5f)
              .withSlots(slots)
              .build();

        validateTranslation(result);

        // two slots, both populated
        slots.clear();
        slots.put("number", numSlot);
        Slot slotTwo = new Slot("color", "red", "red");
        slots.put("color", slotTwo);
        result = new NLUResult.Builder("test")
              .withIntent("intent")
              .withConfidence(0.5f)
              .withSlots(slots)
              .build();

        validateTranslation(result);
    }

    @SuppressWarnings("unchecked")
    private void validateTranslation(NLUResult result) {
        Map<String, Object> event = RNSpokestackModule.toEvent(result);
        Map<String, Object> results = (Map<String, Object>) event.get("result");
        assertNotNull(results);
        Map<String, Object> slots = (Map<String, Object>) results.get("slots");
        assertEquals(result.getIntent(), results.get("intent"));
        assertEquals(String.valueOf(result.getConfidence()),
              results.get("confidence"));
        assertNotNull(slots);
        Map<String, Slot> resultSlots = result.getSlots();
        for (String key : resultSlots.keySet()) {
            Slot originalSlot = resultSlots.get(key);
            Map<String, String> translated =
                  (Map<String, String>) slots.get(key);
            assertEquals(originalSlot.getName(), translated.get("type"));
            assertEquals(originalSlot.getRawValue(), translated.get("rawValue"));
            if (originalSlot.getValue() == null) {
                assertNull(translated.get("value"));
            } else {
                assertEquals(String.valueOf(originalSlot.getValue()),
                      translated.get("value"));
            }
        }
    }
}
