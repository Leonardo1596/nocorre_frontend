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



  /**
   * Distância calculada pelo NativeGpsService
   */
  getDistance(): Promise<{

    meters: number;

    kilometers: number;

  }>;



  /**
   * Reseta distância no serviço Android
   */
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




  // Overlay

  canDrawOverlays(): Promise<{

    granted: boolean;

  }>;



  requestOverlayPermission(): Promise<{

    granted: boolean;

  }>;



  /**
   * Exibe overlay com dados da corrida Uber
   */
  showUberOverlay(
    trip: UberTrip
  ): Promise<void>;



  /**
   * Remove overlay da corrida Uber
   */
  hideUberOverlay(): Promise<void>;




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



const NativeGps =
  registerPlugin<NativeGpsPlugin>(
    "NativeGps"
  );


export { NativeGps };