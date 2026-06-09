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
    private static final float MIN_MOVEMENT_SPEED_KPH = 1.0f; // Minimum speed to be considered moving (in km/h)
    private static final long MIN_TIME_DELTA_MS = 500; // Minimum time between points to calculate speed
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

                    // Filter 1: Accuracy Check.
                    if (location.getAccuracy() > MAX_ACCURACY) {
                        Log.d(TAG, "[DISCARD] Reason: Inaccurate. Accuracy: " + location.getAccuracy() + "m (Max: " + MAX_ACCURACY + "m)");
                        continue;
                    }

                    // First valid location.
                    if (lastLocation == null) {
                        Log.i(TAG, "[PROCESS] Reason: First valid GPS fix. Lat=" + location.getLatitude() + ", Lng=" + location.getLongitude());
                        if (locationRepository.hasListeners()) {
                            locationRepository.setLocationData(location);
                        } else {
                            saveLocationToFile(location);
                        }
                        lastLocation = location;
                        continue;
                    }

                    // --- Start Calculations ---
                    long timeDelta = location.getTime() - lastLocation.getTime(); // milliseconds
                    float distance = location.distanceTo(lastLocation); // meters

                    // Filter 2: Time Delta. Avoid processing points that are too close in time.
                    if (timeDelta < MIN_TIME_DELTA_MS) {
                        Log.d(TAG, "[DISCARD] Reason: Too frequent. Time since last point: " + timeDelta + "ms (Min: " + MIN_TIME_DELTA_MS + "ms)");
                        continue;
                    }

                    float calculatedSpeedKph = (distance / (timeDelta / 1000.0f)) * 3.6f;

                    // Filter 3: Standstill. Discard if movement is negligible.
                    if (calculatedSpeedKph < MIN_MOVEMENT_SPEED_KPH) {
                        Log.d(TAG, "[DISCARD] Reason: Standstill. Calculated speed: " + String.format("%.2f", calculatedSpeedKph) + " km/h (Min: " + MIN_MOVEMENT_SPEED_KPH + " km/h)");
                        // IMPORTANT: We do NOT update lastLocation here. We are waiting for a point that represents actual movement.
                        // If we updated it, the next point would have a very small distance and also be discarded.
                        continue;
                    }

                    // Filter 4: Speed Jump / Teleportation. Discard if movement is impossibly fast.
                    if (calculatedSpeedKph > MAX_SPEED_KPH) {
                        Log.w(TAG, "[DISCARD] Reason: Speed Jump (Teleportation). Calculated speed: " + String.format("%.2f", calculatedSpeedKph) + " km/h (Max: " + MAX_SPEED_KPH + " km/h)");
                        // We also don't update lastLocation here, as this point is considered a glitch.
                        continue;
                    }
                    
                    // --- If all filters pass, process the point ---
                    Log.i(TAG, "[PROCESS] Reason: Valid movement. Speed: " + String.format("%.2f", calculatedSpeedKph) + " km/h | Accuracy: " + location.getAccuracy() + "m");
                    if (locationRepository.hasListeners()) {
                        locationRepository.setLocationData(location);
                    } else {
                        saveLocationToFile(location);
                    }
                    
                    // Update the last location to the current valid *moving* point.
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
                                location.getAccuracy() + "
";
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
