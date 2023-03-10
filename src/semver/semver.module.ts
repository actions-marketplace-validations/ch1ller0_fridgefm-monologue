import { injectable, createToken, createModule } from '@fridgefm/inverter';
import { inc, compare } from 'semver';
import type { SemverString } from '../registry/registry.types';

export type ReleaseType = 'major' | 'minor' | 'patch';

type SemverService = {
  increase: (version: SemverString, releaseType: ReleaseType) => SemverString;
  compare: typeof compare;
};

const SEMVER = createToken<SemverService>('semver:service');

export const SemverModule = createModule({
  name: 'SemverModule',
  providers: [
    injectable({
      provide: SEMVER,
      useValue: {
        increase: (version, releaseType) => {
          // in terms of versions, starting at 0 major release is actually a position for minor
          if (version.startsWith('0')) {
            return inc(
              version,
              (
                {
                  patch: 'patch',
                  minor: 'patch',
                  major: 'minor',
                } as const
              )[releaseType],
            ) as SemverString;
          }
          return inc(version, releaseType) as SemverString;
        },
        compare: (a, b) => compare(a, b),
      },
    }),
  ],
  exports: { SEMVER },
});
