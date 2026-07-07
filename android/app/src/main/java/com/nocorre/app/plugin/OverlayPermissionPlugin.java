package com.nocorre.app.plugin;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "OverlayPermission")
public class OverlayPermissionPlugin extends Plugin {

    @PluginMethod
    public void check(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            JSObject ret = new JSObject();
            ret.put("hasPermission", Settings.canDrawOverlays(getContext()));
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("hasPermission", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getContext())) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivityForResult(intent, 123);
            }
        }
        call.resolve();
    }
}