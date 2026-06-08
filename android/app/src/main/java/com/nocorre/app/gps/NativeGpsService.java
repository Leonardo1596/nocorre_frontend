package com.nocorre.app.gps;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.nocorre.app.R;
import java.io.FileOutputStream;
import java.io.IOException;

public class NativeGpsService extends Service {

    private static final String TAG = "NativeGpsService";
    private static final float MAX_ACCURACY = 15.0f; // Maximum accuracy in meters
    private static final float MAX_SPEED_KPH = 150.0f; // Maximum plausible speed in km/h
    private static final float MIN_MOVEMENT_SPEED_KPH = 6.0f; // Minimum speed to be considered moving (in km/h)
    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";
    public static boolean isRunning = false;

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRepository locationRepository;
    private Location lastLocation;

    private static final String CHANNEL_ID = "GpsServiceChannel";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "onCreate");

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        locationRepository = LocationRepository.getInstance();

        createNotificationChannel();
        createLocationCallback();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand");
        isRunning = true;

        Notification notification =
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("NoCorre em execução")
                .setContentText("Monitorando sua localização para calcular seus ganhos.")
                .setSmallIcon(R.drawable.ic_launcher_background)
                .build();

        startForeground(1, notification);
        startLocationUpdates();

        return START_STICKY;
    }

    private void createLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) return;

                for (Location location : locationResult.getLocations()) {
                    if (location == null) continue;

                    // Filter 1: Accuracy Check. Discard any weak signals.
                    if (location.getAccuracy() > MAX_ACCURACY) {
                        Log.d(TAG, "GPS UPDATE DISCARDED (Inaccurate) | Accuracy: " + location.getAccuracy() + "m");
                        continue;
                    }

                    // If this is the first valid location, we have nothing to compare it to.
                    // Store it as the reference point and wait for the next one.
                    if (lastLocation == null) {
                        lastLocation = location;
                        continue;
                    }

                    // --- Unified Speed Calculation ---
                    // Calculate speed based on distance and time, not the unreliable location.getSpeed().
                    long timeDelta = location.getTime() - lastLocation.getTime();
                    if (timeDelta < 500) { // Avoid rapid-fire calculations
                        continue;
                    }
                    float distance = location.distanceTo(lastLocation); // meters
                    float calculatedSpeedKph = (distance / (timeDelta / 1000.0f)) * 3.6f; // km/h


                    // Filter 2 & 3: Standstill and Speed Jump Check (All-or-Nothing)
                    if (calculatedSpeedKph < MIN_MOVEMENT_SPEED_KPH) {
                        Log.d(TAG, "GPS UPDATE DISCARDED (Standstill) | Calculated Speed: " + calculatedSpeedKph + " km/h");
                        // Do NOT update lastLocation. Keep the last *moving* point as reference.
                        continue;
                    } 
                    if (calculatedSpeedKph > MAX_SPEED_KPH) {
                        Log.d(TAG, "GPS UPDATE DISCARDED (Speed Jump) | Calculated Speed: " + calculatedSpeedKph + " km/h");
                        // Do NOT update lastLocation. A speed jump is likely a GPS error.
                        continue;
                    }
                    
                    // --- PROCESSING --- 
                    // If we reach here, the point is valid and represents real movement.
                    if (locationRepository.hasListeners()) {
                        Log.d(TAG, "GPS UPDATE (ONLINE) | " +
                            "Lat=" + location.getLatitude() +
                            " | Lng=" + location.getLongitude());
                        locationRepository.setLocationData(location);
                    } else {
                        Log.d(TAG, "GPS UPDATE (OFFLINE) | " +
                            "Lat=" + location.getLatitude() +
                            " | Lng=" + location.getLongitude());
                        saveLocationToFile(location);
                    }
                    
                    // --- STATE UPDATE ---
                    // NOW, and only now, we update the last location to the current valid point.
                    lastLocation = location;
                }
            }
        };
    }

    private void saveLocationToFile(Location location) {
        String locationString = System.currentTimeMillis() + "," +
                                location.getLatitude() + "," +
                                location.getLongitude() + "," +
                                location.getSpeed() + "," +
                                location.getAccuracy() + "\n";
        try {
            FileOutputStream fos = openFileOutput(PENDING_LOCATIONS_FILE, MODE_APPEND);
            fos.write(locationString.getBytes());
            fos.close();
        } catch (IOException e) {
            Log.e(TAG, "Error saving location to file", e);
        }
    }

    private void startLocationUpdates() {
        LocationRequest locationRequest = new LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY,
                1000
            )
            .setMinUpdateIntervalMillis(1000)
            .build();

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            );
            Log.d(TAG, "Location updates started.");
        } catch (SecurityException e) {
            Log.e(TAG, "Lost location permission. Could not request updates.", e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");
        isRunning = false;
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Service Channel",
                NotificationManager.IMPORTANCE_HIGH
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
