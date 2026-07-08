package com.nocorre.app.gps;

import android.Manifest;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.nocorre.app.accessibility.UberAccessibilityService;

@CapacitorPlugin(
    name = "Gps",
    permissions = {
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class GpsPlugin extends Plugin {

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

    @PluginMethod
    public void isAccessibilityServiceEnabled(PluginCall call) {
        ComponentName cn = new ComponentName(getContext(), UberAccessibilityService.class);
        String enabledServices = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabledServices == null) {
            enabledServices = "";
        }
        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServices);
        boolean isEnabled = false;
        while (colonSplitter.hasNext()) {
            String componentName = colonSplitter.next();
            if (componentName.equalsIgnoreCase(cn.flattenToString())) {
                isEnabled = true;
                break;
            }
        }

        JSObject ret = new JSObject();
        ret.put("isEnabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        getActivity().startActivity(intent);
        call.resolve();
    }
}
