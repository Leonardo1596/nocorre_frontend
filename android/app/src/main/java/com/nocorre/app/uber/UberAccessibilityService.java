package com.nocorre.app.uber;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

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
                    // Here you would broadcast the rideInfo to your app'''s UI
                    // For now, we'''ll just log it
                    System.out.println("Uber Ride Info: " + rideInfo.toString());
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
