package com.nocorre.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import org.json.JSONObject;

import java.util.Locale;

public class UberOverlayService extends Service {

    private static final String TAG = "UberOverlayService";

    private WindowManager windowManager;
    private View overlayView;

    private View uberOverlayCard;
    private TextView tvKmValue;
    private TextView tvHoraValue;
    private TextView tvRatingValue;
    private TextView tvTripDetails;
    private TextView tvFareValue;
    private View indicatorKm;
    private View indicatorHora;
    private View indicatorRating;

    private Handler handler = new Handler(Looper.getMainLooper());

    private Runnable hideRunnable = new Runnable() {
        @Override
        public void run() {
            Log.d(TAG, "Tempo expirado. Removendo overlay Uber");
            stopSelf();
        }
    };

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        try {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

            overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null);

            uberOverlayCard = overlayView.findViewById(R.id.uberOverlayCard);
            tvKmValue = overlayView.findViewById(R.id.tvKmValue);
            tvHoraValue = overlayView.findViewById(R.id.tvHoraValue);
            tvRatingValue = overlayView.findViewById(R.id.tvRatingValue);
            tvTripDetails = overlayView.findViewById(R.id.tvTripDetails);
            tvFareValue = overlayView.findViewById(R.id.tvFareValue);
            indicatorKm = overlayView.findViewById(R.id.indicatorKm);
            indicatorHora = overlayView.findViewById(R.id.indicatorHora);
            indicatorRating = overlayView.findViewById(R.id.indicatorRating);

            // Permite fechar ao tocar no card
            overlayView.setOnClickListener(v -> stopSelf());

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT
            );

            // Posiciona no topo, centralizado horizontalmente (estilo da imagem de referência)
            params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            params.y = dpToPx(55);

            windowManager.addView(overlayView, params);

            Log.d(TAG, "Overlay Uber iniciado");

        } catch (Exception e) {
            Log.e(TAG, "Erro criando overlay Uber", e);
            stopSelf();
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }

        String tripJson = intent.getStringExtra("trip");

        if (tripJson != null) {
            try {
                JSONObject trip = new JSONObject(tripJson);
                updateUberTrip(trip);

                handler.removeCallbacks(hideRunnable);
                handler.postDelayed(hideRunnable, 20000); // 20 segundos

            } catch (Exception e) {
                Log.e(TAG, "Erro lendo corrida Uber", e);
            }
        }

        return START_NOT_STICKY;
    }

    private void updateUberTrip(JSONObject trip) {
        if (overlayView == null) return;

        overlayView.post(() -> {
            try {
                double fare = trip.optDouble("fare", 0);
                double pickupKm = trip.optDouble("pickupDistanceKm", 0);
                double tripKm = trip.optDouble("tripDistanceKm", 0);
                String pickupTime = trip.optString("pickupTime", "0");
                String tripTime = trip.optString("tripTime", "0");
                double rating = trip.optDouble("rating", 0);

                int pickupMinutes = extractMinutes(pickupTime);
                int tripMinutes = extractMinutes(tripTime);
                int totalMinutes = pickupMinutes + tripMinutes;

                double totalKm = pickupKm + tripKm;
                if (totalKm <= 0 && tripKm > 0) totalKm = tripKm;

                double ganhoKm = (totalKm > 0) ? (fare / totalKm) : 0;
                double ganhoHora = (totalMinutes > 0) ? (fare / (totalMinutes / 60.0)) : 0;

                if (tvKmValue != null) {
                    tvKmValue.setText(String.format(Locale.US, "%.2f", ganhoKm));
                }

                if (tvHoraValue != null) {
                    tvHoraValue.setText(String.format(Locale.US, "%.2f", ganhoHora));
                }

                if (tvRatingValue != null) {
                    if (rating > 0) {
                        tvRatingValue.setText(String.format(Locale.US, "%.2f", rating));
                    } else {
                        tvRatingValue.setText("4.93");
                    }
                }

                if (tvTripDetails != null) {
                    int hours = totalMinutes / 60;
                    int mins = totalMinutes % 60;
                    String timeFormatted = hours > 0
                            ? String.format(Locale.US, "%dh%02dm", hours, mins)
                            : String.format(Locale.US, "%02dm", mins);
                    String kmFormatted = String.format(Locale.US, "%.2fkm", totalKm);
                    tvTripDetails.setText(timeFormatted + " · " + kmFormatted);
                }

                if (tvFareValue != null) {
                    tvFareValue.setText(String.format(Locale.GERMANY, "R$ %.2f", fare));
                }

                // Ajusta cor da borda baseado no R$/km (Sinalização inteligente)
                // Se R$/Km >= 2.0 -> Verde Neon (#00E676)
                // Se R$/Km >= 1.5 -> Amarelo (#FFB300)
                // Se R$/Km < 1.5  -> Vermelho (#FF5252)
                int strokeColor = Color.parseColor("#00E676");
                if (ganhoKm > 0 && ganhoKm < 1.5) {
                    strokeColor = Color.parseColor("#FF5252");
                } else if (ganhoKm >= 1.5 && ganhoKm < 2.0) {
                    strokeColor = Color.parseColor("#FFB300");
                }

                if (uberOverlayCard != null && uberOverlayCard.getBackground() instanceof GradientDrawable) {
                    GradientDrawable bg = (GradientDrawable) uberOverlayCard.getBackground();
                    bg.setStroke(dpToPx(3), strokeColor);
                }

                if (indicatorKm != null && indicatorKm.getBackground() instanceof GradientDrawable) {
                    GradientDrawable indBg = (GradientDrawable) indicatorKm.getBackground();
                    indBg.setColor(strokeColor);
                }

                if (indicatorHora != null && indicatorHora.getBackground() instanceof GradientDrawable) {
                    GradientDrawable indBg = (GradientDrawable) indicatorHora.getBackground();
                    indBg.setColor(strokeColor);
                }

            } catch (Exception e) {
                Log.e(TAG, "Erro calculando corrida", e);
            }
        });
    }

    private int extractMinutes(String time) {
        try {
            if (time == null || time.isEmpty()) {
                return 0;
            }
            String numbers = time.replaceAll("[^0-9]", "");
            if (numbers.isEmpty()) {
                return 0;
            }
            return Integer.parseInt(numbers);
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Destruindo UberOverlayService");

        handler.removeCallbacks(hideRunnable);

        try {
            if (overlayView != null && windowManager != null) {
                windowManager.removeView(overlayView);
            }
        } catch (Exception e) {
            Log.e(TAG, "Erro removendo overlay Uber", e);
        }

        overlayView = null;
        uberOverlayCard = null;
        tvKmValue = null;
        tvHoraValue = null;
        tvRatingValue = null;
        tvTripDetails = null;
        tvFareValue = null;
        indicatorKm = null;
        indicatorHora = null;
        indicatorRating = null;
        windowManager = null;

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
