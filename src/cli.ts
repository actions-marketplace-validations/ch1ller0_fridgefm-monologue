#!/usr/bin/env node

import { createContainer } from '@fridgefm/inverter';
import { CliModule } from './cli/cli.module';
import { LoggerModule } from './logger/logger.module';
import { SemverModule } from './semver/semver.module';
import { GitModule } from './git/git.module';
import { publishCommand } from './commands/publish.command';
const { CLI_ROOT } = CliModule.exports;

/**
 * This container includes only packages that are
 * not configurable by commands and are singletons
 */
export const baseContainer = createContainer({
  modules: [CliModule, LoggerModule, SemverModule, GitModule],
  providers: [publishCommand],
});

baseContainer.get(CLI_ROOT).catch((e) => {
  console.error(e);
  process.exit(1);
});
