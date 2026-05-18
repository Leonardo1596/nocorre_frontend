import { Capacitor } from "@capacitor/core";

export async function startForegroundService() { if (Capacitor.getPlatform() !== "android") { return; }

const { Plugins } = Capacitor as any;

const intent = (window as any).Capacitor?.Plugins;

console.log( "Foreground service iniciado" ); }

export async function stopForegroundService() { console.log( "Foreground service parado" ); }