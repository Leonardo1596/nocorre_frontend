package com.nocorre.app.gps;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "NativeGps",
    permissions = {
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class GpsPlugin extends Plugin {

    private static final String TAG = "GpsPlugin";
    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";

    @PluginMethod
    public void start(PluginCall call) {
        if (!hasRequiredPermissions()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                requestPermissionForAlias("notifications", call, "onNotificationPermissionResult");
            } else {
                requestPermissionForAlias("location", call, "onLocationPermissionResult");
            }
        } else {
            startService(call);
        }
    }

    @ActivityCallback
    private void onLocationPermissionResult(PluginCall call, ActivityResult result) {
        if (call != null && hasRequiredPermissions()) {
            startService(call);
        } else if (call != null) {
            call.reject("Location permission was not granted.");
        }
    }

    @ActivityCallback
    private void onNotificationPermissionResult(PluginCall call, ActivityResult result) {
        if (call != null && hasRequiredPermissions()) {
            startService(call);
        } else if (call != null) {
            call.reject("Notification permission was not granted.");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), NativeGpsService.class);
        getContext().stopService(serviceIntent);
        call.resolve();
    }
    
    @PluginMethod
    public void restoreState(PluginCall call) {
        Context context = getContext();
        List<Location> locations = new ArrayList<>();
        try (
            FileInputStream fis = context.openFileInput(PENDING_LOCATIONS_FILE);
            InputStreamReader inputStreamReader = new InputStreamReader(fis);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader)
        ) {
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length >= 5) { // Ensure at least 5 parts
                    try {
                        Location location = new Location("fused");
                        location.setTime(Long.parseLong(parts[0]));
                        location.setLatitude(Double.parseDouble(parts[1]));
                        location.setLongitude(Double.parseDouble(parts[2]));
                        location.setSpeed(Float.parseFloat(parts[3]));
                        location.setAccuracy(Float.parseFloat(parts[4]));
                        locations.add(location);
                    } catch (NumberFormatException e) {
                        Log.e(TAG, "Error parsing location line: " + line, e);
                    }
                }
            }
        } catch (IOException e) {
            Log.d(TAG, "No pending locations to read or error reading file.", e);
        }

        float totalDistance = 0;
        if (locations.size() > 1) {
            for (int i = 0; i < locations.size() - 1; i++) {
                totalDistance += locations.get(i).distanceTo(locations.get(i + 1));
            }
        }

        // Clear the file after processing
        try (FileOutputStream fos = context.openFileOutput(PENDING_LOCATIONS_FILE, Context.MODE_PRIVATE)) {
            // Overwriting with an empty string clears the file.
        } catch (IOException e) {
            Log.e(TAG, "Error clearing pending locations file", e);
        }
        
        JSObject ret = new JSObject();
        ret.put("accumulatedDistance", totalDistance / 1000.0); // Convert meters to kilometers
        call.resolve(ret);
    }


    @PluginMethod
    public void isGpsRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isRunning", NativeGpsService.isRunning);
        call.resolve(ret);
    }

    private void startService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), NativeGpsService.class);
        ContextCompat.startForegroundService(getContext(), serviceIntent);
        call.resolve();
    }
}