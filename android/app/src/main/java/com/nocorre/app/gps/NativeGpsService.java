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

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;

public class NativeGpsService extends Service {

    private static final String TAG = "NativeGpsService";
    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";
    public static boolean isRunning = false;

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;

    private static final String CHANNEL_ID = "GpsServiceChannel";

    private LocationRepository locationRepository;

    @Override
    public void onCreate() {
        super.onCreate();

        Log.d(TAG, "onCreate");

        fusedLocationClient =
            LocationServices.getFusedLocationProviderClient(this);

        locationRepository =
            LocationRepository.getInstance();

        createNotificationChannel();
        createLocationCallback();
    }

    @Override
    public int onStartCommand(
        Intent intent,
        int flags,
        int startId
    ) {

        Log.d(TAG, "onStartCommand");
        isRunning = true;

        Notification notification =
            new NotificationCompat.Builder(
                this,
                CHANNEL_ID
            )
                .setContentTitle("GPS Service")
                .setContentText("Tracking your location.")
                .setSmallIcon(
                    R.drawable.ic_launcher_background
                )
                .build();

        startForeground(1, notification);

        startLocationUpdates();

        return START_STICKY;
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

                        Log.d(
                            TAG,
                            "GPS UPDATE | " +
                            "Lat=" + location.getLatitude() +
                            " | Lng=" + location.getLongitude() +
                            " | Acc=" + location.getAccuracy() + "m" +
                            " | Speed=" + location.getSpeed() + "m/s" +
                            " | Time=" + System.currentTimeMillis()
                        );

                        locationRepository
                            .setLocationData(location);
                        
                        // Save location to file
                        String locationString = location.getTime() + "," + location.getLatitude() + "," + location.getLongitude() + "," + location.getSpeed() + "," + location.getAccuracy() + "\n";
                        try {
                            File file = new File(getFilesDir(), PENDING_LOCATIONS_FILE);
                            FileOutputStream fileOutputStream = new FileOutputStream(file, true);
                            OutputStreamWriter outputStreamWriter = new OutputStreamWriter(fileOutputStream);
                            outputStreamWriter.write(locationString);
                            outputStreamWriter.close();
                        } catch (Exception e) {
                            Log.e(TAG, "Error writing location to file", e);
                        }
                    }
                }
            }
        };
    }

    private void startLocationUpdates() {

        LocationRequest locationRequest =
            new LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY,
                1000
            )
                .setMinUpdateIntervalMillis(1000)
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

    @Override
    public void onDestroy() {

        super.onDestroy();

        Log.d(TAG, "onDestroy");
        isRunning = false;

        if (
            fusedLocationClient != null &&
            locationCallback != null
        ) {

            fusedLocationClient
                .removeLocationUpdates(
                    locationCallback
                );
        }
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
                    "GPS Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
                );

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
}
