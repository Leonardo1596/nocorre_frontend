package com.nocorre.app.gps;

import android.location.Location;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

public class LocationRepository {

    private static LocationRepository instance;
    private final MutableLiveData<Location> locationData = new MutableLiveData<>();

    private LocationRepository() {}

    public static synchronized LocationRepository getInstance() {
        if (instance == null) {
            instance = new LocationRepository();
        }
        return instance;
    }

    public LiveData<Location> getLocationData() {
        return locationData;
    }

    public void setLocationData(Location location) {
        locationData.postValue(location);
    }

    public boolean hasListeners() {
        // hasActiveObservers is true if there is at least one observer that is not paused.
        // Our plugin adds an observer that is tied to the Activity lifecycle,
        // so this is a reliable way to check if the app is in the foreground and listening.
        return locationData.hasActiveObservers();
    }
}
