import { createModule, injectable, internalTokens, createChildContainer } from '@fridgefm/inverter';
import { Command } from 'commander';
import { PackagesModule } from '../package/package.module';
import { RegistryModule } from '../registry/registry.module';
import { ConfigModule } from '../config/config.module';
import { CLI_COMMAND, CLI_ROOT, CLI_RUN, type Register } from './cli.tokens';

const { ENV_USED } = ConfigModule.exports;

export const CliModule = createModule({
  name: 'CliModule',
  providers: [
    injectable({
      provide: CLI_ROOT,
      useFactory: (baseContainer, registeredCommands) => {
        const register: Register = (provider, options) =>
          createChildContainer(baseContainer, {
            modules: [RegistryModule, ConfigModule, PackagesModule],
            providers: [injectable({ provide: ENV_USED, useValue: options || {} }), provider],
          })
            .get(CLI_RUN)
            .then((v) => v());

        const { description, version } = require('../../package.json');
        const program = new Command('monologue');
        program.name('monologue').description(description).version(version);
        if (!registeredCommands.length) {
          throw new Error('Zero commands were registered');
        }
        registeredCommands.forEach((a) => a({ program, register }));

        return program.parseAsync(process.argv);
      },
      inject: [internalTokens.SELF_CONTAINER, CLI_COMMAND] as const,
    }),
  ],
  exports: { CLI_COMMAND, CLI_ROOT, CLI_RUN },
});
