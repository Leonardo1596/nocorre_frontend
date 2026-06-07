package com.nocorre.app.gps;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;

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
                 requestPermissionForAlias("location", call, "onNotificationPermissionResult");
            } else {
                startService(call);
            }
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

    @PluginMethod
    public void getPendingLocations(PluginCall call) {
        Context context = getContext();
        List<String> lines = new ArrayList<>();
        try {
            FileInputStream fis = context.openFileInput(PENDING_LOCATIONS_FILE);
            InputStreamReader inputStreamReader = new InputStreamReader(fis);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                lines.add(line);
            }
            fis.close();
        } catch (IOException e) {
            Log.d(TAG, "No pending locations to read or error reading file.");
        }

        JSONArray jsonArray = new JSONArray();
        for (String line : lines) {
            String[] parts = line.split(",");
            if (parts.length == 5) {
                try {
                    JSObject loc = new JSObject();
                    loc.put("timestamp", Long.parseLong(parts[0]));
                    loc.put("latitude", Double.parseDouble(parts[1]));
                    loc.put("longitude", Double.parseDouble(parts[2]));
                    loc.put("speed", Float.parseFloat(parts[3]));
                    loc.put("accuracy", Float.parseFloat(parts[4]));
                    jsonArray.put(loc);
                } catch (NumberFormatException e) {
                    Log.e(TAG, "Error parsing location line: " + line, e);
                }
            }
        }

        try (FileOutputStream fos = context.openFileOutput(PENDING_LOCATIONS_FILE, Context.MODE_PRIVATE)) {
            // Overwrite with an empty string to clear
        } catch (IOException e) {
            Log.e(TAG, "Error clearing pending locations file", e);
        }

        JSObject ret = new JSObject();
        ret.put("locations", jsonArray);
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
