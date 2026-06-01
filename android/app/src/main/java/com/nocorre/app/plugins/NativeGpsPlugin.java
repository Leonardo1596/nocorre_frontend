package com.nocorre.app.plugins; // Make sure this matches your plugin's package

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.location.Location;
import com.nocorre.app.gps.FusedLocationManager; // Import your FusedLocationManager
import com.nocorre.app.gps.FusedLocationManager.LocationListener; // Import the interface

// Add these imports for starting the service
import android.content.Intent;
import android.os.Build;

@CapacitorPlugin(name = "NativeGps") // This name must match 'pluginId' in JS
public class NativeGpsPlugin extends Plugin implements LocationListener {

    private FusedLocationManager fusedLocationManager;
    private static final String TAG = "NativeGpsPlugin";

    @Override
    public void load() {
        // Initialize FusedLocationManager when the plugin is loaded.
        // Pass the plugin instance as the context AND the listener.
        fusedLocationManager = new FusedLocationManager(getContext(), this); // <-- CORRECTED LINE
        Log.d(TAG, "Plugin loaded. FusedLocationManager initialized with listener.");
    }

    @PluginMethod
    public void startLocationUpdates(PluginCall call) {
        Log.d(TAG, "Received startLocationUpdates call.");
        if (fusedLocationManager != null) {
            try {
                // Pass 'this' (the plugin instance) as the listener
                fusedLocationManager.start(this);
                Log.d(TAG, "Successfully requested location updates from FusedLocationManager.");
                call.resolve(); // Resolve the JS call indicating success
            } catch (Exception e) {
                Log.e(TAG, "Error starting location updates via FusedLocationManager", e);
                call.reject("Failed to start location updates", e);
            }
        } else {
            Log.e(TAG, "FusedLocationManager is not initialized.");
            call.reject("FusedLocationManager not initialized");
        }
    }

    @PluginMethod
    public void stopLocationUpdates(PluginCall call) {
        Log.d(TAG, "Received stopLocationUpdates call.");
        if (fusedLocationManager != null) {
            fusedLocationManager.stop();
            Log.d(TAG, "Stopped location updates via FusedLocationManager.");
            call.resolve();
        } else {
            Log.e(TAG, "FusedLocationManager is not initialized.");
            call.reject("FusedLocationManager not initialized");
        }
    }

    // --- NEW METHOD TO START FOREGROUND SERVICE ---
    @PluginMethod
    public void startForegroundService(PluginCall call) {
        Log.d(TAG, "Received startForegroundService call.");
        // Use getContext() from the Plugin class to get the Android Context
        android.content.Context context = getContext();
        Intent intent = new Intent(context, com.nocorre.app.gps.NativeGpsService.class); // Use fully qualified name

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
                Log.d(TAG, "Foreground service started via plugin.");
                call.resolve();
            } else {
                context.startService(intent);
                Log.d(TAG, "Background service started (pre-Oreo) via plugin.");
                call.resolve();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground service via plugin", e);
            call.reject("Failed to start foreground service", e);
        }
    }
    // --- END NEW METHOD ---


    // --- Implementation of LocationListener interface ---
    @Override
    public void onLocation(Location location) {
        Log.d(TAG, "onLocation received from FusedLocationManager: Lat=" + location.getLatitude() + ", Lng=" + location.getLongitude());

        // Create a JSObject to send to JavaScript
        JSObject locationData = new JSObject();
        locationData.put("latitude", location.getLatitude());
        locationData.put("longitude", location.getLongitude());
        if (location.hasAccuracy()) {
            locationData.put("accuracy", (double) location.getAccuracy());
        }
        if (location.getTime() > 0) {
            locationData.put("timestamp", location.getTime());
        }

        // Emit the event to JavaScript using Capacitor's notifyListeners
        // 'gpsUpdate' is the event name that your JS GpsContext is listening for.
        notifyListeners("gpsUpdate", locationData);
        Log.d(TAG, "Emitted 'gpsUpdate' event with data.");
    }

    // Ensure your MainActivity correctly starts the NativeGpsService IF it's needed.
    // The plugin itself will manage FusedLocationManager.
    // If NativeGpsService is still necessary for foreground notification, ensure it's started.
    // However, the plugin methods should be sufficient to control FusedLocationManager.
}