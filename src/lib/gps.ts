import { registerPlugin } from '@capacitor/core';

export interface LocationPoint {
  time: number;
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}

export interface ShiftState {
  isShiftActive: boolean;
  isPaused: boolean;
  shiftDistance: number;
  productiveDistance: number;
  totalPausedKm: number;
  kmAtPauseStart: number;
}

export interface NativeGpsPlugin {
  startGps(): Promise<void>;
  stopGps(): Promise<void>;
  isGpsRunning(): Promise<{ isRunning: boolean }>;
  restoreState(): Promise<{ accumulatedDistance: number, lastLocation: LocationPoint | null }>;
  getShiftState(): Promise<ShiftState | null>;
  setShiftState(state: ShiftState): Promise<void>;
  clearShiftState(): Promise<void>;
  clearGpsLog(): Promise<void>;
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (location: LocationPoint) => void
  ): Promise<any>;
}

const NativeGps = registerPlugin<NativeGpsPlugin>('NativeGps');

export { NativeGps };
