import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { createToken, createModule, injectable } from '@fridgefm/inverter';
import got from 'got';
import clone from '@tinkoff/utils/clone';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import type { NpmResponse, SemverString } from './registry.types';
import type { LocalPackage } from '../package/package.module';

const REGISTRY = createToken<{
  packageInfo: (name: string) => Promise<NpmResponse | undefined>;
  publishPackage: (pack: LocalPackage, nextVersion: SemverString) => Promise<void>;
}>('registry:service');

const { CONFIG_SERVICE, ENV_VALIDATE } = ConfigModule.exports;
const { LOGGER } = LoggerModule.exports;

export const RegistryModule = createModule({
  name: 'RegistryModule',
  providers: [
    injectable({
      provide: REGISTRY,
      useFactory: (logger, configService) => {
        const npmRegistryUrl = configService.getOrThrow<string>('npmRegistryUrl');
        const dryRun = configService.getOrThrow<boolean>('dryRun');

        return {
          packageInfo: (packageName) => {
            const fullUrl = `${npmRegistryUrl}${packageName}/latest`;
            logger.info(`Requesting: ${fullUrl}`);

            return got(fullUrl, { timeout: 5000 })
              .json<NpmResponse>()
              .catch((e) => {
                if (e.message.includes('Response code 404')) {
                  logger.warn(
                    `Package "${packageName}" not found in registry, has it been ever released?`,
                  );
                  return undefined;
                }
                throw e;
              });
          },
          publishPackage: async (pack: LocalPackage, nextVersion: SemverString) => {
            const { path, packageJson } = pack;
            const modifiedJson = clone(packageJson);
            // @ts-ignore
            modifiedJson.version = nextVersion;
            await writeFile(path, JSON.stringify(modifiedJson, undefined, 2));
            const { stdout, stderr } = await promisify(exec)(
              `npm publish ${path.replace('package.json', '')} ${dryRun ? '--dry-run' : ''}`,
            );
            // cleanup
            await writeFile(path, JSON.stringify(packageJson, undefined, 2));
            logger.info(`\n${stdout}${stderr}`);
          },
        };
      },
      inject: [LOGGER, CONFIG_SERVICE] as const,
    }),
    injectable({
      provide: ENV_VALIDATE,
      useValue: (z) => ({
        dryRun: z.boolean().default(true), // @TODO change to false when ready
        npmRegistryUrl: z.string().url().endsWith('/').default('https://registry.npmjs.org/'),
      }),
    }),
  ],
  exports: { REGISTRY },
});
