#!/usr/bin/env node

import { Command } from 'commander';
import { declareContainer } from '@fridgefm/inverter';
import { containerConfig } from './container';
import { ConfigModule } from './modules/config/config.module';
import { ROOT_FN_TOKEN } from './modules/root.module';

try {
  const program = new Command('autopub');
  const json = require('../package.json');

  program.name('monologue').description(json.description).version(json.version);

  program
    .command('publish')
    .description('Publish local packages to remote registry')
    .option('--npm-auth-token <npmAuthToken>', 'token for npm registry')
    .option('--npm-registry-url <npmRegistryUrl>', 'url for npm registry')
    .option('--dry-run', 'should not execute the actual publish')
    .action((options) => {
      declareContainer({
        ...containerConfig,
        modules: containerConfig.modules?.concat([ConfigModule.forRoot(options)]),
      }).get(ROOT_FN_TOKEN)();
    });

  program.parse(process.argv);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}
