import { injectable, TokenProvide } from '@fridgefm/inverter';
import { LoggerModule } from '../logger/logger.module';
import { PackagesModule } from '../package/package.module';
import { RegistryModule } from '../registry/registry.module';
import { CliModule } from '../cli/cli.module';
import { SemverModule } from '../semver/semver.module';

const { REGISTRY } = RegistryModule.exports;
const { PACKAGES } = PackagesModule.exports;
const { RENDER } = LoggerModule.exports;
const { CLI_COMMAND, CLI_RUN } = CliModule.exports;
const { SEMVER } = SemverModule.exports;

export const publishProvider = injectable({
  provide: CLI_RUN,
  useFactory: (
    registry: TokenProvide<typeof REGISTRY>,
    packages: TokenProvide<typeof PACKAGES>,
    render: TokenProvide<typeof RENDER>,
    semver: TokenProvide<typeof SEMVER>,
  ) => {
    return async () => {
      const localPackages = await packages.getLocalPackages();
      const calculatedPackages = await Promise.all(
        localPackages.map((s) =>
          registry.packageInfo(s.packageJson.name).then((remotePackage) => ({
            name: s.packageJson.name,
            path: s.path,
            currentVersion: remotePackage?.version,
            nextVersion: remotePackage?.version
              ? semver.increase(remotePackage.version, 'minor')
              : 'skip',
          })),
        ),
      );

      render.table(
        calculatedPackages.map((s) => ({
          name: s.name,
          path: s.path,
          current: s.currentVersion || 'none',
          next: s.nextVersion || 'none',
        })),
      );
    };
  },
  inject: [REGISTRY, PACKAGES, RENDER, SEMVER] as const,
});

export const publishCommand = injectable({
  provide: CLI_COMMAND,
  useValue: ({ program, register }) =>
    program
      .command('publish')
      .description('Publish local packages to remote registry')
      .option('--npm-registry-url <npmRegistryUrl>', 'url for npm registry')
      .option('--dry-run', 'should not execute the actual publish')
      .action((options) => register(publishProvider, options)),
});
