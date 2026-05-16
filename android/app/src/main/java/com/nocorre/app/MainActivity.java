package com.nocorre.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebSettings webSettings = getBridge().getWebView().getSettings();

        webSettings.setTextZoom(100);

        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(false);

        Intent serviceIntent =
                new Intent(
                        this,
                        MyForegroundService.class
                );

        startForegroundService(serviceIntent);
    }
}