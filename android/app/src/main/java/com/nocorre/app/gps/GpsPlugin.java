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

@CapacitorPlugin(
    name = "NativeGps",
    permissions = {
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class GpsPlugin extends Plugin {

    public static boolean isAppInForeground = false;
    private static final String TAG = "GpsPlugin";
    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        isAppInForeground = true;
        Log.d(TAG, "handleOnResume: App is in foreground");
        // Process pending locations when the app resumes
        processPendingLocations();
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        isAppInForeground = false;
        Log.d(TAG, "handleOnPause: App is in background");
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (!hasRequiredPermissions()) {
                requestPermissionForAlias("notifications", call, "onNotificationPermissionResult");
            } else {
                startService(call);
            }
        } else {
            if (!hasRequiredPermissions()) {
                requestPermissionForAlias("location", call, "onLocationPermissionResult");
            } else {
                startService(call);
            }
        }
    }

    @ActivityCallback
    private void onLocationPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        if (hasRequiredPermissions()) {
            startService(call);
        } else {
            call.reject("Location permission was not granted.");
        }
    }

    @ActivityCallback
    private void onNotificationPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        if (hasRequiredPermissions()) {
            startService(call);
        } else {
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
    public void watchPosition(final PluginCall call) {
        call.setKeepAlive(true);

        LocationRepository
            .getInstance()
            .getLocationData()
            .observe(
                this.getBridge().getActivity(),
                location -> {
                    JSObject ret = new JSObject();
                    ret.put("latitude", location.getLatitude());
                    ret.put("longitude", location.getLongitude());
                    ret.put("speed", location.getSpeed());
                    ret.put("accuracy", location.getAccuracy());
                    ret.put("timestamp", location.getTime());
                    call.resolve(ret);
                }
            );
    }

    private void processPendingLocations() {
        Context context = getContext();
        try {
            FileInputStream fis = context.openFileInput(PENDING_LOCATIONS_FILE);
            InputStreamReader inputStreamReader = new InputStreamReader(fis);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 5) {
                    try {
                        Location location = new Location("fused");
                        location.setTime(Long.parseLong(parts[0]));
                        location.setLatitude(Double.parseDouble(parts[1]));
                        location.setLongitude(Double.parseDouble(parts[2]));
                        location.setSpeed(Float.parseFloat(parts[3]));
                        location.setAccuracy(Float.parseFloat(parts[4]));

                        LocationRepository.getInstance().setLocationData(location);
                    } catch (NumberFormatException e) {
                        Log.e(TAG, "Error parsing location line: " + line, e);
                    }
                }
            }
            fis.close();

            // Clear the file after processing
            try (FileOutputStream fos = context.openFileOutput(PENDING_LOCATIONS_FILE, Context.MODE_PRIVATE)) {
                // Overwrite with an empty string to clear
            } catch (IOException e) {
                Log.e(TAG, "Error clearing pending locations file", e);
            }
        } catch (IOException e) {
            Log.d(TAG, "No pending locations to read or error reading file.");
        }
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
