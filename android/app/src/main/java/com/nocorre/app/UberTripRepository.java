package com.nocorre.app;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

public class UberTripRepository {

    private static UberTripRepository instance;

    private final MutableLiveData<UberTrip> tripData =
            new MutableLiveData<>();

    public static synchronized UberTripRepository getInstance() {

        if (instance == null) {
            instance = new UberTripRepository();
        }

        return instance;
    }

    public LiveData<UberTrip> getTripData() {
        return tripData;
    }

    public void setTrip(UberTrip trip) {
        tripData.postValue(trip);
    }
}