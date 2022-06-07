import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import git from 'simple-git';

export const GIT = createToken<ReturnType<typeof git>>('git:simple');

export const GitModule = declareModule({
  name: 'GitModule',
  providers: [injectable({ provide: GIT, useValue: git() })],
});
