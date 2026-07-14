package com.nocorre.app;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UberTripParser {

    private static final Pattern FARE_PATTERN =
            Pattern.compile("R\\$\\s*([0-9]+(?:[\\.,][0-9]+)?)");

    private static final Pattern DISTANCE_TIME_PATTERN =
            Pattern.compile("([0-9]+(?:[\\.,][0-9]+)?)\\s*km\\s*\\((.*?)\\)");

    public static UberTrip parse(List<String> texts) {

        UberTrip trip = new UberTrip();

        if (texts == null || texts.isEmpty()) {
            return trip;
        }

        String current;

        boolean foundPickup = false;
        boolean foundTrip = false;

        for (int i = 0; i < texts.size(); i++) {

            current = texts.get(i).trim();

            if (current.isEmpty()) {
                continue;
            }

            //----------------------------------------------------
            // VALOR DA CORRIDA
            // Pega somente o PRIMEIRO "R$" encontrado.
            //----------------------------------------------------

            if (!trip.isOffer) {

                Matcher fareMatcher =
                        FARE_PATTERN.matcher(current);

                if (fareMatcher.find()) {

                    try {

                        trip.fare =
                                Double.parseDouble(
                                        fareMatcher.group(1)
                                                .replace(",", ".")
                                );

                        trip.isOffer = true;

                    } catch (Exception ignored) {
                    }
                }
            }

            //----------------------------------------------------
            // DISTÂNCIA + TEMPO
            //----------------------------------------------------

            Matcher distanceMatcher =
                    DISTANCE_TIME_PATTERN.matcher(current);

            if (distanceMatcher.find()) {

                double distance =
                        Double.parseDouble(
                                distanceMatcher.group(1)
                                        .replace(",", ".")
                        );

                String time =
                        distanceMatcher.group(2);

                if (!foundPickup) {

                    trip.pickupDistanceKm = distance;
                    trip.pickupTime = time;

                    foundPickup = true;

                } else if (!foundTrip) {

                    trip.tripDistanceKm = distance;
                    trip.tripTime = time;

                    foundTrip = true;
                }
            }

            //----------------------------------------------------
            // ORIGEM
            //----------------------------------------------------

            if (foundPickup &&
                    trip.origin == null &&
                    !current.contains("km") &&
                    !current.startsWith("R$") &&
                    !current.equalsIgnoreCase("Accept") &&
                    !current.equalsIgnoreCase("Match") &&
                    !current.equalsIgnoreCase("Aceitar") &&
                    !current.equalsIgnoreCase("Selecionar") &&
                    !current.equalsIgnoreCase("Moto") &&
                    !current.equalsIgnoreCase("Exclusive") &&
                    !current.equalsIgnoreCase("Verified")) {

                trip.origin = current;
                continue;
            }

            //----------------------------------------------------
            // DESTINO
            //----------------------------------------------------

            if (trip.origin != null &&
                    foundTrip &&
                    trip.destination == null &&
                    !current.contains("km") &&
                    !current.startsWith("R$") &&
                    !current.equalsIgnoreCase("Accept") &&
                    !current.equalsIgnoreCase("Match") &&
                    !current.equalsIgnoreCase("Aceitar") &&
                    !current.equalsIgnoreCase("Selecionar") &&
                    !current.equalsIgnoreCase("Moto") &&
                    !current.equalsIgnoreCase("Exclusive") &&
                    !current.equalsIgnoreCase("Verified") &&
                    !current.equals(trip.origin)) {

                trip.destination = current;
            }
        }

        return trip;
    }
}