import { WebPlugin, registerPlugin } from '@capacitor/core';

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

export interface UberTrip {
  fare: number;
  pickupDistanceKm: number;
  pickupTime: string | null;
  tripDistanceKm: number;
  tripTime: string | null;
  origin: string | null;
  destination: string | null;
}

export interface NativeGpsPlugin {
  startGps(): Promise<void>;
  stopGps(): Promise<void>;
  isGpsRunning(): Promise<{
    isRunning: boolean;
  }>;
  getDistance(): Promise<{
    meters: number;
    kilometers: number;
  }>;
  resetDistance(): Promise<void>;
  restoreState(): Promise<{
    accumulatedDistance: number;
    lastLocation: LocationPoint | null;
  }>;
  getShiftState(): Promise<ShiftState | null>;
  setShiftState(
    state: ShiftState
  ): Promise<void>;
  clearShiftState(): Promise<void>;
  clearGpsLog(): Promise<void>;

  canDrawOverlays(): Promise<{
    granted: boolean;
  }>;
  requestOverlayPermission(): Promise<{
    granted: boolean;
  }>;
  setCostPerKm(options: { costPerKm: number; token?: string }): Promise<void>;
  getCostPerKm(): Promise<{ costPerKm: number }>;
  showUberOverlay(
    trip: UberTrip
  ): Promise<void>;
  hideUberOverlay(): Promise<void>;
  showOverlay(): Promise<void>;
  hideOverlay(): Promise<void>;

  addListener(
    eventName: "locationUpdate",
    listenerFunc: (
      location: LocationPoint
    ) => void
  ): Promise<any>;

  addListener(
    eventName: "uberTrip",
    listenerFunc: (
      trip: UberTrip
    ) => void
  ): Promise<any>;
}

export class NativeGpsWeb extends WebPlugin implements NativeGpsPlugin {
  private watchId: number | null = null;
  private totalMeters: number = 0;
  private lastPoint: LocationPoint | null = null;
  private currentShiftState: ShiftState | null = null;

  async startGps(): Promise<void> {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      if (this.watchId !== null) return;
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const point: LocationPoint = {
            time: position.timestamp,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed || 0,
            accuracy: position.coords.accuracy,
          };

          if (this.lastPoint) {
            const d = this.calculateDistance(
              this.lastPoint.latitude,
              this.lastPoint.longitude,
              point.latitude,
              point.longitude
            );
            this.totalMeters += d;
          }
          this.lastPoint = point;

          this.notifyListeners('locationUpdate', point);
        },
        (error) => {
          console.warn('Geolocation warning on web:', error.message);
          // Auto-recuperação caso caia por timeout
          if (this.watchId !== null && typeof window !== 'undefined') {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            setTimeout(() => {
              this.startGps().catch(() => {});
            }, 3000);
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  }

  async stopGps(): Promise<void> {
    if (this.watchId !== null && typeof window !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async isGpsRunning(): Promise<{ isRunning: boolean }> {
    return { isRunning: this.watchId !== null };
  }

  async getDistance(): Promise<{ meters: number; kilometers: number }> {
    return {
      meters: Math.round(this.totalMeters),
      kilometers: Number((this.totalMeters / 1000).toFixed(2)),
    };
  }

  async resetDistance(): Promise<void> {
    this.totalMeters = 0;
    this.lastPoint = null;
  }

  async restoreState(): Promise<{
    accumulatedDistance: number;
    lastLocation: LocationPoint | null;
  }> {
    return {
      accumulatedDistance: Number((this.totalMeters / 1000).toFixed(2)),
      lastLocation: this.lastPoint,
    };
  }

  async getShiftState(): Promise<ShiftState | null> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nocorre_native_shift_state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return this.currentShiftState;
  }

  async setShiftState(state: ShiftState): Promise<void> {
    this.currentShiftState = state;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nocorre_native_shift_state', JSON.stringify(state));
    }
  }

  async clearShiftState(): Promise<void> {
    this.currentShiftState = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nocorre_native_shift_state');
    }
  }

  async clearGpsLog(): Promise<void> {}

  async canDrawOverlays(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async requestOverlayPermission(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async setCostPerKm(options: { costPerKm: number; token?: string }): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nocorre_cost_per_km', options.costPerKm.toString());
      if (options.token) {
        localStorage.setItem('nocorre_token', options.token);
      }
    }
  }

  async getCostPerKm(): Promise<{ costPerKm: number }> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nocorre_cost_per_km');
      if (saved) return { costPerKm: parseFloat(saved) };
    }
    return { costPerKm: 0.65 };
  }

  async showUberOverlay(_trip: UberTrip): Promise<void> {}

  async hideUberOverlay(): Promise<void> {}

  async showOverlay(): Promise<void> {}

  async hideOverlay(): Promise<void> {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

const NativeGps = registerPlugin<NativeGpsPlugin>("NativeGps", {
  web: () => new NativeGpsWeb(),
});

export { NativeGps };
