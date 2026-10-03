package com.nocorre.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VehicleCostHelper {

    private static final String TAG = "VehicleCostHelper";
    private static final String PREFS_NAME = "nocorre_vehicle_prefs";
    private static final String KEY_COST_PER_KM = "cost_per_km";
    private static final String KEY_AUTH_TOKEN = "auth_token";

    // Custo padrão por km (caso o usuário ainda não tenha preenchido ajustes)
    public static final double DEFAULT_COST_PER_KM = 0.65;

    private static final String API_URL = "https://nocorre-backend-4w01.onrender.com/maintenance-settings";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public interface CostCallback {
        void onCostReady(double costPerKm);
    }

    public static double getCostPerKm(Context context) {
        if (context == null) return DEFAULT_COST_PER_KM;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        float cost = prefs.getFloat(KEY_COST_PER_KM, (float) DEFAULT_COST_PER_KM);
        return cost > 0 ? (double) cost : DEFAULT_COST_PER_KM;
    }

    public static void saveCostPerKm(Context context, double costPerKm) {
        if (context == null || costPerKm <= 0) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putFloat(KEY_COST_PER_KM, (float) costPerKm).apply();
        Log.d(TAG, "Custo por km salvo no SharedPreferences: " + costPerKm);
    }

    public static void saveAuthToken(Context context, String token) {
        if (context == null || token == null || token.trim().isEmpty()) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_AUTH_TOKEN, token.trim()).apply();
    }

    public static String getAuthToken(Context context) {
        if (context == null) return null;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_AUTH_TOKEN, null);
    }

    /**
     * Calcula o custo por km a partir da resposta do endpoint /maintenance-settings
     */
    public static double calculateCostPerKm(JSONObject data) {
        if (data == null) return DEFAULT_COST_PER_KM;

        try {
            JSONObject fuel = data.optJSONObject("fuel");
            JSONObject maintenance = data.optJSONObject("maintenance");

            double fuelPrice = fuel != null ? fuel.optDouble("fuelPrice", 0) : 0;
            double kmPerLiter = fuel != null ? fuel.optDouble("kmPerLiter", 0) : 0;
            double costFuel = kmPerLiter > 0 ? (fuelPrice / kmPerLiter) : 0;

            double costOil = 0;
            double costFrontTire = 0;
            double costRearTire = 0;
            double costChain = 0;

            if (maintenance != null) {
                JSONObject oil = maintenance.optJSONObject("oil");
                if (oil != null) {
                    double price = oil.optDouble("price", 0);
                    double lifespanKm = oil.optDouble("lifespanKm", 0);
                    if (lifespanKm > 0) costOil = price / lifespanKm;
                }

                JSONObject frontTire = maintenance.optJSONObject("frontTire");
                if (frontTire != null) {
                    double price = frontTire.optDouble("price", 0);
                    double lifespanKm = frontTire.optDouble("lifespanKm", 0);
                    if (lifespanKm > 0) costFrontTire = price / lifespanKm;
                }

                JSONObject rearTire = maintenance.optJSONObject("rearTire");
                if (rearTire != null) {
                    double price = rearTire.optDouble("price", 0);
                    double lifespanKm = rearTire.optDouble("lifespanKm", 0);
                    if (lifespanKm > 0) costRearTire = price / lifespanKm;
                }

                JSONObject chain = maintenance.optJSONObject("chain");
                if (chain != null) {
                    double price = chain.optDouble("price", 0);
                    double lifespanKm = chain.optDouble("lifespanKm", 0);
                    if (lifespanKm > 0) costChain = price / lifespanKm;
                }
            }

            double totalCost = costFuel + costOil + costFrontTire + costRearTire + costChain;
            Log.d(TAG, "Calculado custo total por km: " + totalCost);
            return totalCost > 0 ? totalCost : DEFAULT_COST_PER_KM;

        } catch (Exception e) {
            Log.e(TAG, "Erro calculando custo por km do JSON", e);
            return DEFAULT_COST_PER_KM;
        }
    }

    /**
     * Executa o fetch assíncrono para /maintenance-settings e atualiza o SharedPreferences
     */
    public static void fetchCostPerKmAsync(Context context, CostCallback callback) {
        if (context == null) {
            if (callback != null) callback.onCostReady(DEFAULT_COST_PER_KM);
            return;
        }

        final Context appContext = context.getApplicationContext();

        executor.execute(() -> {
            double resolvedCost = getCostPerKm(appContext);
            HttpURLConnection connection = null;

            try {
                String token = getAuthToken(appContext);
                URL url = new URL(API_URL);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(4000);
                connection.setReadTimeout(4000);
                connection.setRequestProperty("Content-Type", "application/json");

                if (token != null && !token.isEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer " + token);
                }

                int responseCode = connection.getResponseCode();
                if (responseCode == 200) {
                    InputStream inputStream = connection.getInputStream();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject jsonResponse = new JSONObject(sb.toString());
                    resolvedCost = calculateCostPerKm(jsonResponse);
                    saveCostPerKm(appContext, resolvedCost);
                    Log.d(TAG, "Fetch de custo por km concluído com sucesso: R$ " + resolvedCost);
                } else {
                    Log.w(TAG, "Fetch de custo retornou código HTTP " + responseCode + ", usando valor em cache: " + resolvedCost);
                }
            } catch (Exception e) {
                Log.w(TAG, "Falha na requisição de custo por km (usando cache/padrão): " + e.getMessage());
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }

            final double finalCost = resolvedCost;
            mainHandler.post(() -> {
                if (callback != null) {
                    callback.onCostReady(finalCost);
                }
            });
        });
    }
}
