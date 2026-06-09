import { registerPlugin } from '@capacitor/core';

export interface LocationPoint {
  time: number;
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}

export interface NativeGpsPlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  isGpsRunning(): Promise<{ isRunning: boolean }>;
  restoreState(): Promise<{ accumulatedDistance: number }>;
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (location: LocationPoint) => void
  ): Promise<any>;
}

const NativeGps = registerPlugin<NativeGpsPlugin>('NativeGps');

export { NativeGps };
