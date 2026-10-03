import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nocorre.app',
  appName: 'NoCorre',
  webDir: 'out',
  plugins: {
    // Your custom plugin
    NativeGps: {}, // Ensure this line exists
  },
};

export default config;