#!/usr/bin/env node

import { declareContainer } from '@fridgefm/inverter';
import { containerConfig } from './container';
import { ConfigModule } from './modules/config/config.module';
import { ROOT_FN_TOKEN } from './modules/root.module';

try {
  declareContainer({
    ...containerConfig,
    modules: containerConfig.modules?.concat([
      ConfigModule.forRoot({ npmAuthToken: 'external-value' }),
    ]),
  }).get(ROOT_FN_TOKEN)();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}
