package com.nocorre.app.uber;

import java.io.Serializable;

public class RideInfo implements Serializable {
    public double price;
    public double pickupDistance;
    public int pickupDuration;
    public double rideDistance;
    public int rideDuration;

    @Override
    public String toString() {
        return "RideInfo{" +
                "price=" + price +
                ", pickupDistance=" + pickupDistance +
                ", pickupDuration=" + pickupDuration +
                ", rideDistance=" + rideDistance +
                ", rideDuration=" + rideDuration +
                '}' ;
    }
}
