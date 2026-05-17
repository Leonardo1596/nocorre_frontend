import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface GpsPlugin {
  startLocationUpdates(): Promise<void>;
  stopLocationUpdates(): Promise<void>;
  getGpsStatus(): Promise<{ status: string }>;
  getLastLocation(): Promise<{ latitude: number; longitude: number }>;
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (location: { latitude: number; longitude: number }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(
    eventName: 'gpsStatusChange',
    listenerFunc: (result: { status: string }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  removeAllListeners(): Promise<void>;
}

const GPS = registerPlugin<GpsPlugin>('MyGPS');

export default GPS;
