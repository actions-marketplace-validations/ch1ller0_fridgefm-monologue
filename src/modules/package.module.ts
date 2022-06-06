import { parse } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';
import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import glob from 'glob';
import { CONFIG_SERVICE } from './config/config.module';
import type { IPackageJson } from 'package-json-type';

type LocalPackage = {
  path: string;
  packageJson: IPackageJson;
};

export const PACKAGE_SERVICE = createToken<{
  getLocalPackages: () => Promise<LocalPackage[]>;
}>('package:locals');

export const PackageModule = declareModule({
  name: 'PackageModule',
  providers: [
    injectable({
      provide: PACKAGE_SERVICE,
      useFactory: (configService) => {
        const localPackagesPattern = configService.get('localPackagesDir');

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
              return name === 'package' && ext === 'json';
            });

            return Promise.all(
              filteredPaths.map((path) =>
                promisify(readFile)(path, { encoding: 'utf-8' }).then((s) => ({
                  path,
                  packageJson: JSON.parse(s) as IPackageJson,
                })),
              ),
            );
          },
        };
      },
      inject: [CONFIG_SERVICE] as const,
    }),
  ],
});
