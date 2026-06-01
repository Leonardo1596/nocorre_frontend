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

import com.google.android.gms.location.*;

public class NativeGpsService extends Service {

    private static final String CHANNEL_ID = "gps_channel";
    private static final int NOTIF_ID = 1001;

    private FusedLocationProviderClient fusedClient;
    private LocationCallback callback;

    @Override
    public void onCreate() {
        super.onCreate();

        fusedClient = LocationServices.getFusedLocationProviderClient(this);

        createChannel();
        startForeground(NOTIF_ID, buildNotification());

        startGps();
    }

    private void startGps() {

        LocationRequest request = new LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY,
                2000
        )
                .setMinUpdateIntervalMillis(1000)
                .setWaitForAccurateLocation(true)
                .build();

        callback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {

                if (result == null) return;

                for (Location loc : result.getLocations()) {

                    Log.d("GPS",
                            "LAT=" + loc.getLatitude()
                                    + " LNG=" + loc.getLongitude()
                                    + " ACC=" + loc.getAccuracy()
                    );
                }
            }
        };

        try {

            fusedClient.requestLocationUpdates(
                    request,
                    callback,
                    Looper.getMainLooper()
            );

            Log.d("GPS", "REQUEST LOCATION STARTED");

        } catch (SecurityException e) {

            Log.e("GPS", "SEM PERMISSAO", e);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("GPS ativo")
                .setContentText("Rastreamento em execução")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .build();
    }

    private void createChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "GPS Service",
                    NotificationManager.IMPORTANCE_LOW
            );

            NotificationManager manager =
                    getSystemService(NotificationManager.class);

            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        if (fusedClient != null && callback != null) {
            fusedClient.removeLocationUpdates(callback);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}