package com.nocorre.app.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;

public class UberAccessibilityService extends AccessibilityService {

    private static final String TAG = "UBER_ACCESSIBILITY";
    private static final String UBER_PACKAGE_NAME = "com.ubercab.driver";

    private final AccessibilityNodePrinter nodePrinter = new AccessibilityNodePrinter();

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) {
            return;
        }

        Log.d(TAG, "onAccessibilityEvent: " + event.getEventType());

        if (event.getPackageName() != null && event.getPackageName().toString().equals(UBER_PACKAGE_NAME)) {
            int eventType = event.getEventType();
            if (eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
                eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
                eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED) {

                AccessibilityNodeInfo rootNode = getRootInActiveWindow();
                if (rootNode != null) {
                    nodePrinter.traverseNode(rootNode);
                    rootNode.recycle();
                }
            }
        }
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "onInterrupt");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "onServiceConnected");
    }
}
