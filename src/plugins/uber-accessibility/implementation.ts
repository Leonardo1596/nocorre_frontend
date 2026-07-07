import { registerPlugin } from '@capacitor/core';

import type { UberAccessibilityPlugin } from './definitions';

const UberAccessibility = registerPlugin<UberAccessibilityPlugin>('UberAccessibility', {
  web: () => import('./web').then(m => new m.UberAccessibilityWeb()),
});

export default UberAccessibility;
