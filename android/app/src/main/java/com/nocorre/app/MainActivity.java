package com.nocorre.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.nocorre.app.gps.NativeGpsService;

public class MainActivity extends BridgeActivity {

    private static final int REQ = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d("GPS", "MAIN ACTIVITY ONCREATE");

        checkPermission();
    }

    private void checkPermission() {

        boolean fineGranted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        boolean coarseGranted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        if (!fineGranted || !coarseGranted) {

            Log.d("GPS", "SOLICITANDO PERMISSAO");

            ActivityCompat.requestPermissions(
                    this,
                    new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                    },
                    REQ
            );

            return;
        }

        // REMOVED: startGpsService(); // <-- REMOVE THIS LINE
        Log.d("GPS", "Permissions already granted. Service will be started manually.");
    }

    private void startGpsService() {
        Log.d("GPS", "START FOREGROUND SERVICE");

        Intent intent = new Intent(this, NativeGpsService.class);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
        } catch (Exception e) {
            Log.e("GPS", "Erro ao iniciar service", e);
        }
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ) {

            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;

            if (granted) {

                Log.d("GPS", "PERMISSAO CONCEDIDA");
                // REMOVED: startGpsService(); // <-- REMOVE THIS LINE
                Log.d("GPS", "Permissions granted. Service will be started manually.");

            } else {

                Log.d("GPS", "PERMISSAO NEGADA");
            }
        }
    }
}