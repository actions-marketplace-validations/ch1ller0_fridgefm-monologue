import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import omit from '@tinkoff/utils/object/omit';
import { PACKAGE_SERVICE } from './package.module';
import { REGISTRY_SERVICE } from './registry/registry.module';
import { LOGGER, RENDER_SERVICE } from './render.module';
import { SEMVER } from './semver.module';
import { GIT } from './git.module';
import type { SemverString } from './registry/registry.types';

export const ROOT_FN_TOKEN = createToken<() => Promise<void>>('root:fn');

export const RootModule = declareModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: ROOT_FN_TOKEN,
      useFactory: (logger, packageService, registryService, semver, render, git) => async () => {
        logger.info('CLI started...');
        const logs = await git.log();

        try {
          const localPackages = await packageService.getLocalPackages();
          const localRemotes = await Promise.all(
            localPackages.map((local) =>
              registryService
                .packageInfo(local.packageJson.name!)
                .then((remote) => ({ local, remote })),
            ),
          );
          const highestCurrentVersion = localRemotes.reduce(
            (acc, cur) => (semver.compare(cur.remote.version, acc) > 0 ? cur.remote.version : acc),
            '0.0.0' as SemverString,
          );

          const releaseTypeTodo = 'minor'; // @TODO determine release-type somehow
          const releases = localRemotes.map((s) => {
            const skipped = () => {
              if (!!s.local.packageJson.private) return 'package/private';
              if (s.remote.gitHead === process.env.GITHUB_SHA) return 'remote/same-gh-sha';
              if (s.remote.gitHead === logs.latest?.hash) return 'remote/same-log-sha';
              return undefined;
            };

            const reason = 'direct-change'; // @TODO add reason
            return {
              local: s.local,
              remote: s.remote,
              name: s.remote.name,
              current: s.remote.version,
              next: skipped()
                ? s.remote.version
                : semver.increase(highestCurrentVersion, releaseTypeTodo),
              reason,
              skipped: skipped() || 'no',
            };
          });
          render.table(releases.map(omit(['local', 'remote'])));

          await Promise.all(
            releases
              .filter((s) => s.skipped === 'no')
              .map((s) => registryService.publishPackage(s.local, s.next)),
          );
        } catch (e) {
          logger.error(e);
          process.exit(1);
        }
      },
      inject: [LOGGER, PACKAGE_SERVICE, REGISTRY_SERVICE, SEMVER, RENDER_SERVICE, GIT] as const,
    }),
  ],
});
