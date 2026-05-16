package com.nocorre.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class MyForegroundService extends Service {

    private static final String CHANNEL_ID = "gps_tracking_channel";

    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();

        Notification notification =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setContentTitle("NoCorre GPS ativo")
                        .setContentText("Rastreamento em andamento")
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setOngoing(true)
                        .build();

        startForeground(1, notification);
    }

    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.O
        ) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "GPS Tracking",
                            NotificationManager.IMPORTANCE_LOW
                    );

            NotificationManager manager =
                    getSystemService(
                            NotificationManager.class
                    );

            if (manager != null) {
                manager.createNotificationChannel(
                        channel
                );
            }
        }
    }
}