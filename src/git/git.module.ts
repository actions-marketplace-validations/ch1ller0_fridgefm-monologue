import { createToken, createModule, injectable } from '@fridgefm/inverter';
import createGit from 'simple-git';

type GitClient = ReturnType<typeof createGit>;

const GIT = createToken<{
  getLogs: (a: { from: string; to: string }) => ReturnType<GitClient['log']>;
}>('git:service');

export const GitModule = createModule({
  name: 'GitModule',
  providers: [
    injectable<typeof GIT, []>({
      scope: 'singleton',
      provide: GIT,
      useFactory: () => {
        const git = createGit();

        return {
          getLogs: (a: { from: string; to: string }) => git.log(a),
        };
      },
    }),
  ],
  exports: { GIT },
});
