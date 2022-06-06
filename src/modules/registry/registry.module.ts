import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import got from 'got';
import clone from '@tinkoff/utils/clone';
import { CONFIG_SERVICE } from '../config/config.module';
import { LOGGER, RENDER_SERVICE } from '../render.module';
import type { NpmResponse, SemverString } from './registry.types';
import type { LocalPackage } from '../package.module';

export const REGISTRY_SERVICE = createToken<{
  packageInfo: (name: string) => Promise<NpmResponse>;
  publishPackage: (pack: LocalPackage, nextVersion: SemverString) => Promise<void>;
}>('registry:service');

export const RegistryModule = declareModule({
  name: 'RegistryModule',
  providers: [
    injectable({
      provide: REGISTRY_SERVICE,
      useFactory: (logger, configService) => {
        const npmRegistryUrl = configService.get('npmRegistryUrl');
        const dryRun = configService.get('dryRun');

        return {
          packageInfo: (packageName) =>
            got(`${npmRegistryUrl}${packageName}/latest`)
              .json<NpmResponse>()
              .catch((e) => {
                if (e.message.includes('Response code 404')) {
                  logger.error(
                    `Package "${packageName}" not found in registry, has it been ever released?`,
                  );
                }

                throw e;
              }),
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
      inject: [LOGGER, CONFIG_SERVICE, RENDER_SERVICE] as const,
    }),
  ],
});
