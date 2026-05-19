package com.nocorre.app;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ForegroundService")
public class ForegroundServicePlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {

        Intent serviceIntent =
                new Intent(
                        getContext(),
                        MyForegroundService.class
                );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            getContext().startForegroundService(
                    serviceIntent
            );

        } else {

            getContext().startService(
                    serviceIntent
            );
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {

        Intent serviceIntent =
                new Intent(
                        getContext(),
                        MyForegroundService.class
                );

        serviceIntent.setAction(
                MyForegroundService.ACTION_STOP_FOREGROUND_SERVICE
        );

        getContext().startService(
                serviceIntent
        );

        call.resolve();
    }
}