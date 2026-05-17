package com.nocorre.app.gps;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import java.util.function.Consumer;

public class GPSManager {

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Context context;
    private Consumer<Location> onLocationUpdate;
    private Consumer<Boolean> onGpsStatusChange;
    private Location lastLocation;
    private boolean isGpsEnabled;

    public GPSManager(Context context, Consumer<Location> onLocationUpdate, Consumer<Boolean> onGpsStatusChange) {
        this.context = context;
        this.onLocationUpdate = onLocationUpdate;
        this.onGpsStatusChange = onGpsStatusChange;
        this.fusedLocationClient = LocationServices.getFusedLocationProviderClient(context);
        this.isGpsEnabled = isGpsProviderEnabled();
        createLocationCallback();
        startGpsStatusListener();
    }

    public void startLocationUpdates() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(10000); // 10 seconds
        locationRequest.setFastestInterval(5000); // 5 seconds
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null);
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }

    public void stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback);
    }

    public String getGpsStatus() {
        return isGpsEnabled ? "active" : "inactive";
    }

    public Location getLastLocation() {
        return lastLocation;
    }

    private void createLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    lastLocation = location;
                    onLocationUpdate.accept(location);
                }
            }
        };
    }

    private void startGpsStatusListener() {
        new Thread(() -> {
            while (true) {
                boolean currentGpsStatus = isGpsProviderEnabled();
                if (currentGpsStatus != isGpsEnabled) {
                    isGpsEnabled = currentGpsStatus;
                    onGpsStatusChange.accept(isGpsEnabled);
                }
                try {
                    Thread.sleep(5000); // Check every 5 seconds
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }

    private boolean isGpsProviderEnabled() {
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
    }
}
