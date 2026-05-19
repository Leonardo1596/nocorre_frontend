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

    public static final String ACTION_STOP_FOREGROUND_SERVICE = "ACTION_STOP_FOREGROUND_SERVICE";
    private static final String CHANNEL_ID = "foreground_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP_FOREGROUND_SERVICE.equals(intent.getAction())) {
            // If we receive a stop action, stop the service
            stopForeground(true);
            stopSelf();
        } else {
            // Otherwise, this is a start action. Create notification and start foreground.
            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("App em execução")
                    .setContentText("O app está ativo em segundo plano.")
                    .setSmallIcon(R.mipmap.ic_launcher) // Ensure this icon exists
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .build();

            // This is the critical call, now correctly placed.
            startForeground(1, notification);
        }
        
        // Tells the system to recreate the service if it's killed
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        // We don't provide binding, so return null
        return null;
    }

    private void createNotificationChannel() {
        // This is required for Android 8.0 (Oreo) and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
