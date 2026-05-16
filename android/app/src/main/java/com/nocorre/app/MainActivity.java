package com.nocorre.app;

import com.getcapacitor.BridgeActivity;

import android.content.Intent;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent serviceIntent =
                new Intent(
                        this,
                        MyForegroundService.class
                );

        startForegroundService(serviceIntent);
    }
}