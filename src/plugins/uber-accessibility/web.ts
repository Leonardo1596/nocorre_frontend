import { WebPlugin } from '@capacitor/core';
import { OverlayPermissionPlugin, UberAccessibilityPlugin } from './definitions';

export class UberAccessibilityWeb extends WebPlugin implements UberAccessibilityPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}

export class OverlayPermissionWeb extends WebPlugin implements OverlayPermissionPlugin {
  async check(): Promise<{ hasPermission: boolean }> {
    console.warn('Overlay permission is not available on the web.');
    return { hasPermission: true }; // Always true for web
  }

  async request(): Promise<void> {
    console.warn('Overlay permission is not available on the web.');
  }
}
