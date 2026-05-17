import { Capacitor } from '@capacitor/core';

export interface GpsPlugin {
  startLocationUpdates(): Promise<void>;
  stopLocationUpdates(): Promise<void>;
  getGpsStatus(): Promise<{ status: string }>;
  getLastLocation(): Promise<{ latitude: number; longitude: number }>;
}

const GPS = Capacitor.Plugins.GPS as GpsPlugin;

export default GPS;
