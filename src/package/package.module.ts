import { parse } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';
import { createToken, createModule, injectable } from '@fridgefm/inverter';
import glob from 'glob';
import { z } from 'zod';
import { ConfigModule } from '../config/config.module';
import type { IPackageJson } from 'package-json-type';

const packageJsonSchema = z.object({
  name: z.string(),
  version: z.enum(['0.0.0-stub']),
});

type LocalPackageJson = IPackageJson & z.infer<typeof packageJsonSchema>;

export type LocalPackage = {
  path: string;
  packageJson: LocalPackageJson;
};

const PACKAGES = createToken<{
  getLocalPackages: () => Promise<LocalPackage[]>;
}>('package:locals');

const { CONFIG_SERVICE, ENV_VALIDATE } = ConfigModule.exports;

export const PackagesModule = createModule({
  name: 'PackagesModule',
  providers: [
    injectable({
      scope: 'scoped',
      provide: PACKAGES,
      useFactory: (configService) => {
        const localPackagesPattern = configService.getOrThrow<string>('localPackagesDir');

        return {
          getLocalPackages: async () => {
            const foundFiles = await new Promise<string[]>((resolve, reject) => {
              glob(localPackagesPattern, {}, (err, matches) => {
                if (err) {
                  reject(err);
                }
                resolve(matches);
              });
            });

            const filteredPaths = foundFiles.filter((fullpath) => {
              const { name, ext } = parse(fullpath);
              return name === 'package' && ext === '.json' && !fullpath.includes('node_modules');
            });

            if (!filteredPaths.length) {
              throw new Error(
                `No local packages were found, using glob: "${localPackagesPattern}"`,
              );
            }

            const rawPackages = await Promise.all(
              filteredPaths.map((path) =>
                promisify(readFile)(path, { encoding: 'utf-8' }).then((s) => ({
                  path,
                  packageJson: JSON.parse(s),
                })),
              ),
            );

            return rawPackages.map((s) => ({
              packageJson: packageJsonSchema.parse(s.packageJson),
              path: s.path,
            }));
          },
        };
      },
      inject: [CONFIG_SERVICE] as const,
    }),
    injectable({
      provide: ENV_VALIDATE,
      useValue: (z) => ({ localPackagesDir: z.string().default('package.json') }),
    }),
  ],
  exports: { PACKAGES },
});
