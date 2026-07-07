import { registerPlugin } from '@capacitor/core';
import { UberAccessibilityWeb, OverlayPermissionWeb } from './web';
import { UberAccessibilityPlugin, OverlayPermissionPlugin } from './definitions';

export const UberAccessibility = registerPlugin<UberAccessibilityPlugin>('UberAccessibility', {
  web: () => new UberAccessibilityWeb(),
});

export const OverlayPermission = registerPlugin<OverlayPermissionPlugin>('OverlayPermission', {
  web: () => new OverlayPermissionWeb(),
});
