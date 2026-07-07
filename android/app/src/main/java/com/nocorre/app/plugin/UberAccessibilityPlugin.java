package com.nocorre.app.plugin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.nocorre.app.uber.RideInfo;
import com.nocorre.app.uber.UberAccessibilityService;

@CapacitorPlugin(name = "UberAccessibility")
public class UberAccessibilityPlugin extends Plugin {

    private BroadcastReceiver rideInfoReceiver;

    @Override
    protected void handleOnStart() {
        super.handleOnStart();
        rideInfoReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                RideInfo rideInfo = (RideInfo) intent.getSerializableExtra(UberAccessibilityService.EXTRA_RIDE_INFO);
                if (rideInfo != null) {
                    JSObject ret = new JSObject();
                    ret.put("price", rideInfo.price);
                    ret.put("distance", rideInfo.pickupDistance);
                    ret.put("eta", rideInfo.pickupDuration);
                    ret.put("category", "uberx"); // You may want to parse this from the screen as well
                    notifyListeners("rideReceived", ret);
                }
            }
        };
        LocalBroadcastManager.getInstance(getContext()).registerReceiver(rideInfoReceiver, new IntentFilter(UberAccessibilityService.ACTION_RIDE_INFO));
    }

    @Override
    protected void handleOnStop() {
        super.handleOnStop();
        LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(rideInfoReceiver);
    }

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }
}
