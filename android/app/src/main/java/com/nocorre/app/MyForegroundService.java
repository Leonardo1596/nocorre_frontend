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

    public static final String ACTION_STOP_FOREGROUND_SERVICE =
            "ACTION_STOP_FOREGROUND_SERVICE";

    private static final String CHANNEL_ID =
            "foreground_channel";

    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();
    }

    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {

        if (
                intent != null &&
                ACTION_STOP_FOREGROUND_SERVICE.equals(
                        intent.getAction()
                )
        ) {

            stopForeground(true);
            stopSelf();

        } else {

            Notification notification =
                    new NotificationCompat.Builder(
                            this,
                            CHANNEL_ID
                    )
                            .setContentTitle(
                                    "App em execução"
                            )
                            .setContentText(
                                    "O app está ativo em segundo plano."
                            )
                            .setSmallIcon(
                                    R.mipmap.ic_launcher
                            )
                            .setPriority(
                                    NotificationCompat.PRIORITY_LOW
                            )
                            .setOngoing(true)
                            .build();

            startForeground(1, notification);
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Foreground Service Channel",
                            NotificationManager.IMPORTANCE_LOW
                    );

            channel.setDescription(
                    "Canal do serviço em segundo plano"
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