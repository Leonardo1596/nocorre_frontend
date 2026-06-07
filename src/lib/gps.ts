import { registerPlugin } from '@capacitor/core';

export interface NativeGpsPlugin {
  startGps(): Promise<void>;
  stopGps(): Promise<void>;
  isGpsRunning(): Promise<{ isRunning: boolean }>;
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (location: { latitude: number; longitude: number }) => void
  ): Promise<any>;
}

const NativeGps = registerPlugin<NativeGpsPlugin>('NativeGps');

export { NativeGps };
