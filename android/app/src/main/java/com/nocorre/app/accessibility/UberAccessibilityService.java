package com.nocorre.app.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UberAccessibilityService extends AccessibilityService {

    private static final String TAG = "UBER_ACCESSIBILITY";
    private static final String UBER_PACKAGE_NAME = "com.ubercab.driver";

    // Pattern to find trip value, e.g., R$ 6,46 or $6.46
    private static final Pattern VALUE_PATTERN = Pattern.compile("(?:R\$|\$)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))");

    // Pattern to find distance and time, e.g., "2.2 km (5 min)" or "5.9 km (9 minutos)"
    private static final Pattern DISTANCE_TIME_PATTERN = Pattern.compile("(\d+[.,]\d*)\s*km\s*\((\d+)\s*min(utos)?\)");

    // Holds the log message of the last detected trip to avoid duplicate logging
    private static String lastLoggedTrip = null;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || !UBER_PACKAGE_NAME.equals(event.getPackageName())) {
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null) {
            processScreen(rootNode);
            rootNode.recycle();
        }
    }

    /**
     * Processes the entire screen content to find and log trip data or driver status.
     */
    private void processScreen(AccessibilityNodeInfo rootNode) {
        List<String> screenTexts = new ArrayList<>();
        collectAllText(rootNode, screenTexts);

        String tripValue = null;
        List<Double> distances = new ArrayList<>();
        List<Integer> times = new ArrayList<>();
        boolean isOnline = false;
        boolean isOffline = false;

        for (String text : screenTexts) {
            // Find Trip Value
            if (tripValue == null) {
                Matcher valueMatcher = VALUE_PATTERN.matcher(text);
                if (valueMatcher.find()) {
                    // Use group(0) to get the full match with currency symbol, e.g., "R$ 6,46"
                    tripValue = valueMatcher.group(0);
                }
            }

            // Find Distances and Times
            Matcher distanceTimeMatcher = DISTANCE_TIME_PATTERN.matcher(text);
            while (distanceTimeMatcher.find()) {
                try {
                    String distanceStr = distanceTimeMatcher.group(1).replace(',', '.');
                    distances.add(Double.parseDouble(distanceStr));

                    String timeStr = distanceTimeMatcher.group(2);
                    times.add(Integer.parseInt(timeStr));
                } catch (NumberFormatException e) {
                    Log.w(TAG, "Failed to parse distance/time from text: " + text, e);
                }
            }

            // Check for simple status keywords
            String lowerCaseText = text.toLowerCase();
            if (lowerCaseText.contains("online")) isOnline = true;
            if (lowerCaseText.contains("offline")) isOffline = true;
        }

        // Check if we found a valid trip offer (must have value and exactly 2 sets of distance/time)
        if (tripValue != null && distances.size() == 2 && times.size() == 2) {
            double totalDistance = distances.get(0) + distances.get(1);
            int totalTime = times.get(0) + times.get(1);

            String newTripLog = String.format(
                "NEW TRIP OFFER | Value: %s | Total Distance: %.2f km | Total Time: %d min",
                tripValue, totalDistance, totalTime
            );

            // Log only if it's a new trip offer
            if (!newTripLog.equals(lastLoggedTrip)) {
                Log.i(TAG, newTripLog);
                lastLoggedTrip = newTripLog;
            }
        } else {
            // If it's not a trip offer screen, reset the log and check for status
            lastLoggedTrip = null;
            if (isOnline) {
                Log.i(TAG, "Driver status: ONLINE");
            } else if (isOffline) {
                Log.i(TAG, "Driver status: OFFLINE");
            }
        }
    }

    /**
     * Recursively traverses the node tree to collect all non-empty text into a list.
     */
    private void collectAllText(AccessibilityNodeInfo nodeInfo, List<String> textList) {
        if (nodeInfo == null) {
            return;
        }
        if (nodeInfo.getText() != null && !nodeInfo.getText().toString().isEmpty()) {
            textList.add(nodeInfo.getText().toString());
        }
        for (int i = 0; i < nodeInfo.getChildCount(); i++) {
            AccessibilityNodeInfo child = nodeInfo.getChild(i);
            // The child node is retrieved, used in the recursive call, but not recycled here
            // to prevent recycling it before its own children are processed.
            // The initial rootNode passed to processScreen is the only one we explicitly recycle.
            collectAllText(child, textList);
        }
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "Service interrupted");
        lastLoggedTrip = null;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "Service connected");
    }
}
