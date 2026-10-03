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

import com.nocorre.app.OverlayService;

import android.content.SharedPreferences;


import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;

public class NativeGpsService extends Service {

    private static final String TAG = "NativeGpsService";
    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";
    public static final String ACTION_STOP_GPS = "com.nocorre.app.ACTION_STOP_GPS";
    public static boolean isRunning = false;

    private static NativeGpsService instance;

public static NativeGpsService getInstance() {
    return instance;
}

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;

    private static final String CHANNEL_ID = "GpsServiceChannel";
    private static final int NOTIFICATION_ID = 1;
    private static final String PREFS_NAME = "gps_state";
    private static final String KEY_DISTANCE = "distance";
    private static final float ACCURACY_THRESHOLD_METERS = 20.0f; // Ignore locations with accuracy > 20m
    private static final float SPEED_THRESHOLD_MPS = 0.5f;      // Ignore locations if speed is < 0.5 m/s (1.8 km/h)

    private LocationRepository locationRepository;

    private Location lastLocation = null;
    private float accumulatedDistanceMeters = 0f;

    @Override
    public void onCreate() {
        super.onCreate();

        instance = this;

        Log.d(TAG, "onCreate");

        fusedLocationClient =
            LocationServices.getFusedLocationProviderClient(this);

        locationRepository =
            LocationRepository.getInstance();

        createNotificationChannel();
        createLocationCallback();

        SharedPreferences prefs =
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

accumulatedDistanceMeters =
        prefs.getFloat(KEY_DISTANCE, 0f);

        lastLocation = null;

Log.d(TAG,
        "Distância restaurada: "
                + (accumulatedDistanceMeters / 1000f)
                + " km");
    }

    @Override
    public int onStartCommand(
        Intent intent,
        int flags,
        int startId
    ) {
        if (intent != null && ACTION_STOP_GPS.equals(intent.getAction())) {
            Log.d(TAG, "ACTION_STOP_GPS recebido no onStartCommand");
            stopLocationUpdates();
            return START_NOT_STICKY;
        }

        Log.d(TAG, "onStartCommand - Iniciando GPS em primeiro plano");
        isRunning = true;

        Notification notification =
            new NotificationCompat.Builder(
                this,
                CHANNEL_ID
            )
                .setContentTitle("NoCorre - Turno em Andamento")
                .setContentText("Monitorando quilometragem e velocidade.")
                .setSmallIcon(
                    R.drawable.ic_launcher_background
                )
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        startForeground(NOTIFICATION_ID, notification);

        startLocationUpdates();

        return START_NOT_STICKY;
    }

    private void createLocationCallback() {

        locationCallback = new LocationCallback() {

            @Override
            public void onLocationResult(
                LocationResult locationResult
            ) {

                if (locationResult == null) {
                    return;
                }

                for (Location location :
                        locationResult.getLocations()) {

                    if (location != null) {

                        // FILTER: Check if the location accuracy is within the threshold
                        if (location.getAccuracy() > ACCURACY_THRESHOLD_METERS) {
                            Log.d(TAG, "GPS FILTER | Accuracy too low: " + location.getAccuracy() + "m. Ignoring.");
                            continue; // Skip this location
                        }

                        // FILTER: Check if the speed is above the threshold
                        if (location.getSpeed() < SPEED_THRESHOLD_MPS) {
                            Log.d(TAG, "GPS FILTER | Speed too low: " + location.getSpeed() + "m/s. Ignoring.");
                            continue; // Skip this location
                        }

                        Log.d(
                            TAG,
                            "GPS UPDATE | " +
                            "Lat=" + location.getLatitude() +
                            " | Lng=" + location.getLongitude() +
                            " | Acc=" + location.getAccuracy() + "m" +
                            " | Speed=" + location.getSpeed() + "m/s" +
                            " | Time=" + System.currentTimeMillis()
                        );

                        // Calcula distância acumulada
if (lastLocation != null) {

    float distance = lastLocation.distanceTo(location);

    // Ignora saltos absurdos do GPS
    if (distance > 0 && distance < 100) {

    accumulatedDistanceMeters += distance;

    SharedPreferences prefs =
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

    prefs.edit()
        .putFloat(KEY_DISTANCE, accumulatedDistanceMeters)
        .commit();
}
}

lastLocation = location;

Log.d(
    TAG,
    "DISTÂNCIA ACUMULADA: "
            + (accumulatedDistanceMeters / 1000f)
            + " km"
);

                        // Save location to file
                        String locationString = location.getTime() + "," + location.getLatitude() + "," + location.getLongitude() + "," + location.getSpeed() + "," + location.getAccuracy() + "\n";
                        try {

    File file =
            new File(getFilesDir(), PENDING_LOCATIONS_FILE);

    try (
        FileOutputStream fileOutputStream =
                new FileOutputStream(file, true);

        OutputStreamWriter outputStreamWriter =
                new OutputStreamWriter(fileOutputStream)
    ) {

        outputStreamWriter.write(locationString);
        outputStreamWriter.flush();

    }

} catch (Exception e) {

    Log.e(TAG, "Error writing location to file", e);

}

                        try {
    locationRepository.setLocationData(location);
} catch (Exception e) {
    Log.e(TAG, "Erro salvando localização", e);
}

// Atualiza somente o velocímetro
try {

    OverlayService overlay =
            OverlayService.getInstance();

    if (
            overlay != null
            &&
            overlay.isSpeedOverlayActive()
    ) {

        overlay.updateSpeed(
                location.getSpeed()
        );

    }

} catch (Exception e) {

    Log.e(
            TAG,
            "Erro atualizando velocímetro",
            e
    );

}

                    } // if (location != null)
                } // for
            } // onLocationResult
        }; // new LocationCallback
    } // createLocationCallback

    private void startLocationUpdates() {

        LocationRequest locationRequest =
            new LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY,
                500
            )
                .setMinUpdateIntervalMillis(500)
                .setWaitForAccurateLocation(true)
                .build();

        try {

            fusedLocationClient
                .requestLocationUpdates(
                    locationRequest,
                    locationCallback,
                    Looper.getMainLooper()
                );

            Log.d(
                TAG,
                "Location updates started."
            );

        } catch (SecurityException e) {

            Log.e(
                TAG,
                "Lost location permission. Could not request updates.",
                e
            );
        }
    }

    public void stopLocationUpdates() {
        Log.d(TAG, "stopLocationUpdates");
        isRunning = false;

        if (fusedLocationClient != null && locationCallback != null) {
            try {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            } catch (Exception e) {
                Log.e(TAG, "Error removing location updates", e);
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(NOTIFICATION_ID);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping foreground notification", e);
        }

        stopSelf();
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy");
        isRunning = false;

        if (fusedLocationClient != null && locationCallback != null) {
            try {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            } catch (Exception e) {
                Log.e(TAG, "Error removing location updates in onDestroy", e);
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(NOTIFICATION_ID);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error dismissing notification in onDestroy", e);
        }

        instance = null;
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(
        Intent intent
    ) {
        return null;
    }

    private void createNotificationChannel() {

        if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.O
        ) {

            NotificationChannel serviceChannel =
                new NotificationChannel(
                    CHANNEL_ID,
                    "NoCorre GPS Service",
                    NotificationManager.IMPORTANCE_LOW
                );
            serviceChannel.setDescription("Notificação contínua enquanto o turno estiver em andamento.");

            NotificationManager manager =
                getSystemService(
                    NotificationManager.class
                );

            if (manager != null) {
                manager.createNotificationChannel(
                    serviceChannel
                );
            }
        }
    }
    public void resetDistance() {

    accumulatedDistanceMeters = 0f;
    lastLocation = null;

    SharedPreferences prefs =
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

    prefs.edit()
            .remove(KEY_DISTANCE)
            .commit();

    Log.d(TAG, "Distância resetada");
}

public float getAccumulatedDistanceMeters() {
    return accumulatedDistanceMeters;
}
}
