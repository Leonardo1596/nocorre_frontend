import { PluginListenerHandle } from "@capacitor/core";

export interface RideInfo {
  category: string;
  price: string;
  distance: string;
  eta: string;
}

export interface UberAccessibilityPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  addListener(eventName: 'rideReceived', listenerFunc: (info: RideInfo) => void): PluginListenerHandle;
}

export interface OverlayPermissionPlugin {
  check(): Promise<{ hasPermission: boolean }>;
  request(): Promise<void>;
}
