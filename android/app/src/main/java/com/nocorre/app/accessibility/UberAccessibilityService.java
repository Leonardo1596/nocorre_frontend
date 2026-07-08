package com.nocorre.app.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UberAccessibilityService extends AccessibilityService {

    private static final String TAG = "UBER_ACCESSIBILITY";
    private static final String UBER_PACKAGE_NAME = "com.ubercab.driver";

    // Regex to find currency values like R$ 12,34 or $12.34
    private static final Pattern EARNINGS_PATTERN = Pattern.compile("[R$|\\]$]\\s*\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{2})");

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) {
            return;
        }

        // We only care about events from the Uber app
        if (UBER_PACKAGE_NAME.equals(event.getPackageName())) {
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null) {
                findAndLogUberData(rootNode);
                rootNode.recycle();
            }
        }
    }

    /**
     * Recursively traverses the node tree and logs any text that matches known Uber patterns.
     * @param nodeInfo The root node to start traversal from.
     */
    private void findAndLogUberData(AccessibilityNodeInfo nodeInfo) {
        if (nodeInfo == null) {
            return;
        }

        CharSequence text = nodeInfo.getText();
        if (text != null && text.length() > 0) {
            String nodeText = text.toString();

            // Check for earnings
            Matcher earningsMatcher = EARNINGS_PATTERN.matcher(nodeText);
            if (earningsMatcher.find()) {
                Log.i(TAG, "Found potential earnings: " + earningsMatcher.group(0));
            }

            // Check for trip status (simple keywords)
            String lowerCaseText = nodeText.toLowerCase();
            if (lowerCaseText.contains("online")) {
                Log.i(TAG, "Found status: ONLINE");
            }
            if (lowerCaseText.contains("offline")) {
                Log.i(TAG, "Found status: OFFLINE");
            }
            if (lowerCaseText.contains("nova viagem") || lowerCaseText.contains("new trip")) {
                Log.i(TAG, "Found status: NEW TRIP");
            }
             if (lowerCaseText.contains("aceitar") || lowerCaseText.contains("accept")) {
                Log.i(TAG, "Found action: ACCEPT");
            }
        }

        // Recurse through children
        for (int i = 0; i < nodeInfo.getChildCount(); i++) {
            AccessibilityNodeInfo child = nodeInfo.getChild(i);
            findAndLogUberData(child);
            // It's important to recycle nodes that you retrieve to avoid memory leaks
            if (child != null) {
                child.recycle();
            }
        }
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "Service interrupted");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "Service connected");
    }
}
