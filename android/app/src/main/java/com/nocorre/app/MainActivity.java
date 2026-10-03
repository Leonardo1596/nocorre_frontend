package com.nocorre.app;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.nocorre.app.gps.NativeGpsPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        Log.d("NOCORRE_TEST", "ANTES REGISTER");

        registerPlugin(NativeGpsPlugin.class);

        Log.d("NOCORRE_TEST", "DEPOIS REGISTER");

        super.onCreate(savedInstanceState);

        Log.d("NOCORRE_TEST", "DEPOIS SUPER");
    }
}