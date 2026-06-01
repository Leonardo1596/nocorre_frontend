package com.nocorre.app.plugins;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.nocorre.app.gps.NativeGpsService;

@CapacitorPlugin(name = "NativeGps")
public class NativeGpsPlugin extends Plugin {

    private Intent serviceIntent;

    public static NativeGpsPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    @PluginMethod
    public void start(PluginCall call) {

        try {

            if (serviceIntent == null) {
                serviceIntent = new Intent(getContext(), NativeGpsService.class);
            }

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }

            call.resolve();

        } catch (Exception e) {

            Log.e("NativeGpsPlugin", "Erro ao iniciar GPS", e);
            call.reject("Erro ao iniciar GPS", e);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {

        try {

            if (serviceIntent != null) {
                getContext().stopService(serviceIntent);
            }

            call.resolve();

        } catch (Exception e) {

            Log.e("NativeGpsPlugin", "Erro ao parar GPS", e);
            call.reject("Erro ao parar GPS", e);
        }
    }

    // 🔥 bridge Android → JS (futuro uso)
    public static void sendGpsUpdate(JSObject data) {

        if (instance != null) {
            instance.notifyListeners("gpsUpdate", data);
        }
    }
}