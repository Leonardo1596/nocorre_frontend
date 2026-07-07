import { PluginListenerHandle } from "@capacitor/core";

export interface RideInfo {
  price: number;
  distance: number;
  eta: number;
  category: string;
}

export interface UberAccessibilityPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  addListener(eventName: 'rideReceived', listenerFunc: (info: RideInfo) => void): Promise<PluginListenerHandle>;
}

export interface OverlayPermissionPlugin {
  check(): Promise<{ hasPermission: boolean }>;
  request(): Promise<void>;
}
