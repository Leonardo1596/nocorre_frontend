import { registerPlugin } from "@capacitor/core";

interface NativeGpsPlugin {
  startForegroundService(): Promise<void>;
  // ... other methods
}

// CORRECTLY REGISTERED PLUGIN NAME
const NativeGps = registerPlugin<NativeGpsPlugin>("NativeGps");

export async function startForegroundService() {
  try {
    await NativeGps.startForegroundService(); // Calls YOUR native plugin
    console.log("JS: Foreground service start command sent via NativeGps plugin.");
  } catch (error) {
    console.error("JS: Failed to send command to start foreground service via NativeGps plugin:", error);
    throw error;
  }
}