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
    private TextView tvTripDetails;
    private TextView tvFareValue;
    private TextView tvNetValue;
    private TextView tvCostPerKmBadge;
    private View indicatorKm;
    private View indicatorHora;

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
            tvTripDetails = overlayView.findViewById(R.id.tvTripDetails);
            tvFareValue = overlayView.findViewById(R.id.tvFareValue);
            tvNetValue = overlayView.findViewById(R.id.tvNetValue);
            tvCostPerKmBadge = overlayView.findViewById(R.id.tvCostPerKmBadge);
            indicatorKm = overlayView.findViewById(R.id.indicatorKm);
            indicatorHora = overlayView.findViewById(R.id.indicatorHora);

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

            // Posiciona no topo, centralizado horizontalmente
            params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            params.y = dpToPx(55);

            windowManager.addView(overlayView, params);

            Log.d(TAG, "Overlay Uber iniciado com sucesso");

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

                int pickupMinutes = extractMinutes(pickupTime);
                int tripMinutes = extractMinutes(tripTime);
                int totalMinutes = pickupMinutes + tripMinutes;
                if (totalMinutes <= 0) {
                    if (pickupMinutes > 0) totalMinutes = pickupMinutes;
                    else if (tripMinutes > 0) totalMinutes = tripMinutes;
                }

                double totalKm = pickupKm + tripKm;
                if (totalKm <= 0) {
                    if (pickupKm > 0) totalKm = pickupKm;
                    else if (tripKm > 0) totalKm = tripKm;
                }

                double ganhoKm = (totalKm > 0) ? (fare / totalKm) : 0;
                double ganhoHora = (totalMinutes > 0) ? (fare / (totalMinutes / 60.0)) : 0;

                if (tvKmValue != null) {
                    if (ganhoKm > 0) {
                        tvKmValue.setText(String.format(Locale.GERMANY, "R$ %.2f", ganhoKm));
                    } else {
                        tvKmValue.setText("---");
                    }
                }

                if (tvHoraValue != null) {
                    if (ganhoHora > 0) {
                        tvHoraValue.setText(String.format(Locale.GERMANY, "R$ %.2f", ganhoHora));
                    } else {
                        tvHoraValue.setText("---");
                    }
                }

                if (tvTripDetails != null) {
                    int hours = totalMinutes / 60;
                    int mins = totalMinutes % 60;
                    String timeFormatted = hours > 0
                            ? String.format(Locale.US, "%dh%02dm", hours, mins)
                            : String.format(Locale.US, "%02dm", mins);
                    String kmFormatted = String.format(Locale.GERMANY, "%.1f km", totalKm);
                    tvTripDetails.setText(timeFormatted + " · " + kmFormatted);
                }

                if (tvFareValue != null) {
                    tvFareValue.setText(String.format(Locale.GERMANY, "R$ %.2f", fare));
                }

                // Custo por KM e Cálculo do Valor Líquido:
                // Custo total da corrida = km total da corrida * custo por km
                // Valor líquido = valor bruto - custo total da corrida
                double costPerKm = VehicleCostHelper.getCostPerKm(this);
                double tripCost = totalKm * costPerKm;
                double netProfit = fare - tripCost;

                if (tvNetValue != null) {
                    tvNetValue.setText(String.format(Locale.GERMANY, "R$ %.2f", netProfit));
                    if (netProfit < 0) {
                        tvNetValue.setTextColor(Color.parseColor("#FF5252"));
                    } else {
                        tvNetValue.setTextColor(Color.parseColor("#00E676"));
                    }
                }

                if (tvCostPerKmBadge != null) {
                    tvCostPerKmBadge.setText(String.format(Locale.GERMANY, "Custo: R$ %.2f/km", costPerKm));
                }

                // Sincroniza em segundo plano caso haja dados atualizados na API
                final double currentKm = totalKm;
                final double currentGross = fare;
                VehicleCostHelper.fetchCostPerKmAsync(this, freshCost -> {
                    if (Math.abs(freshCost - costPerKm) > 0.001) {
                        double freshTripCost = currentKm * freshCost;
                        double freshNet = currentGross - freshTripCost;
                        if (tvNetValue != null) {
                            tvNetValue.setText(String.format(Locale.GERMANY, "R$ %.2f", freshNet));
                            if (freshNet < 0) {
                                tvNetValue.setTextColor(Color.parseColor("#FF5252"));
                            } else {
                                tvNetValue.setTextColor(Color.parseColor("#00E676"));
                            }
                        }
                        if (tvCostPerKmBadge != null) {
                            tvCostPerKmBadge.setText(String.format(Locale.GERMANY, "Custo: R$ %.2f/km", freshCost));
                        }
                    }
                });

                // Ajusta cor do indicador e borda baseado no R$/km (Sinalização inteligente)
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
        tvTripDetails = null;
        tvFareValue = null;
        tvNetValue = null;
        tvCostPerKmBadge = null;
        indicatorKm = null;
        indicatorHora = null;
        windowManager = null;

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
