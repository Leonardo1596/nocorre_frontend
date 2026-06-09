import { registerPlugin } from '@capacitor/core';

export interface LocationPoint {
  time: number;
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}

export interface NativeGpsPlugin {
  startGps(): Promise<void>;
  stopGps(): Promise<void>;
  isGpsRunning(): Promise<{ isRunning: boolean }>;
  restoreState(): Promise<{ accumulatedDistance: number }>;
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (location: LocationPoint) => void
  ): Promise<any>;
}

const NativeGps = registerPlugin<NativeGpsPlugin>('NativeGps');

export { NativeGps };
