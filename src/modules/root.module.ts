import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import { PACKAGE_SERVICE } from './package.module';
import { LOGGER } from './render.module';

export const ROOT_FN_TOKEN = createToken<() => Promise<void>>('root:fn');

export const RootModule = declareModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: ROOT_FN_TOKEN,
      useFactory: (logger, packageService) => async () => {
        try {
          console.log('starting cli...');
          const localPackages = await packageService.getLocalPackages();
          console.log('localP', localPackages);
        } catch (e) {
          logger.error(e);
          process.exit(1);
        }
      },
      inject: [LOGGER, PACKAGE_SERVICE] as const,
    }),
  ],
});

// 1 define packages for the bump
// 2 calculate dependencies between them
// 3 calculate the next version for each packages based on NEXT_VER provider
// 4
