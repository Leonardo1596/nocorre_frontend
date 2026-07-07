package com.nocorre.app.uber;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import com.nocorre.app.plugin.OverlayService;

public class UberAccessibilityService extends AccessibilityService {

    private final UberRideParser rideParser = new UberRideParser();

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            AccessibilityNodeInfo source = event.getSource();
            if (source != null && "com.ubercab".equals(source.getPackageName())) {
                String screenText = extractTextFromNode(source);
                RideInfo rideInfo = rideParser.parse(screenText);
                if (rideInfo != null) {
                    Intent intent = new Intent(this, OverlayService.class);
                    intent.putExtra("rideInfo", rideInfo.toString());
                    startService(intent);
                }
            }
        }
    }

    private String extractTextFromNode(AccessibilityNodeInfo node) {
        if (node == null) {
            return "";
        }
        StringBuilder text = new StringBuilder();
        if (node.getText() != null) {
            text.append(node.getText().toString()).append("\n");
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            text.append(extractTextFromNode(node.getChild(i)));
        }
        return text.toString();
    }

    @Override
    public void onInterrupt() {
        // Handle interruptions
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        // Configure the service
    }
}