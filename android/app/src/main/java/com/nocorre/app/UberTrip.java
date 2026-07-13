package com.nocorre.app;

public class UberTrip {

    public boolean isOffer;

    public double fare;

    public double pickupDistanceKm;
    public String pickupTime;

    public double tripDistanceKm;
    public String tripTime;

    public String origin;
    public String destination;

    @Override
    public String toString() {

        return "UberTrip{" +
                "fare=" + fare +
                ", pickupDistanceKm=" + pickupDistanceKm +
                ", pickupTime='" + pickupTime + '\'' +
                ", tripDistanceKm=" + tripDistanceKm +
                ", tripTime='" + tripTime + '\'' +
                ", origin='" + origin + '\'' +
                ", destination='" + destination + '\'' +
                '}';
    }
}