package com.nocorre.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ForegroundService")
public class ForegroundServicePlugin extends Plugin {

    private Intent serviceIntent;

    @Override
    public void load() {
        super.load();
        // Initialize the intent here to be reused
        serviceIntent = new Intent(getContext(), MyForegroundService.class);
    }

    @PluginMethod
    public void start(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start foreground service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            getContext().stopService(serviceIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop foreground service: " + e.getMessage());
        }
    }
}
