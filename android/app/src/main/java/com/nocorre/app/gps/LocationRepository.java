package com.nocorre.app.gps;

import android.location.Location;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

public class LocationRepository {
    private static volatile LocationRepository instance;
    private final MutableLiveData<Location> locationData = new MutableLiveData<>();

    private LocationRepository() {}

    public static LocationRepository getInstance() {
        if (instance == null) {
            synchronized (LocationRepository.class) {
                if (instance == null) {
                    instance = new LocationRepository();
                }
            }
        }
        return instance;
    }

    public LiveData<Location> getLocationData() {
        return locationData;
    }

    public void setLocationData(Location location) {
        locationData.postValue(location);
    }
}
