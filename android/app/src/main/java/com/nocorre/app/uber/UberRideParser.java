package com.nocorre.app.uber;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UberRideParser {

    public RideInfo parse(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        RideInfo rideInfo = new RideInfo();

        // Extract price
        Pattern pricePattern = Pattern.compile("R\\s*\\$(\\d+\\.\\d{2})");
        Matcher priceMatcher = pricePattern.matcher(text);
        if (priceMatcher.find()) {
            rideInfo.price = Double.parseDouble(priceMatcher.group(1));
        }

        // Extract pickup and ride details
        Pattern distancePattern = Pattern.compile("(\\d+\\.\\d+)\\s*km\\s*\\((\\d+)\\s*min(utos)?\\)");
        Matcher distanceMatcher = distancePattern.matcher(text);

        // First match is pickup
        if (distanceMatcher.find()) {
            rideInfo.pickupDistance = Double.parseDouble(distanceMatcher.group(1));
            rideInfo.pickupDuration = Integer.parseInt(distanceMatcher.group(2));
        }

        // Second match is the main ride
        if (distanceMatcher.find()) {
            rideInfo.rideDistance = Double.parseDouble(distanceMatcher.group(1));
            rideInfo.rideDuration = Integer.parseInt(distanceMatcher.group(2));
        }

        return rideInfo;
    }
}
