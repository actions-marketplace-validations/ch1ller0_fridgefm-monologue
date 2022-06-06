import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import { CONFIG_SERVICE } from './config.module';
import { LOGGER } from './render.module';

export const ROOT_FN_TOKEN = createToken<() => Promise<void>>('root:fn');

export const RootModule = declareModule({
  name: 'RootModule',
  providers: [
    injectable({
      provide: ROOT_FN_TOKEN,
      useFactory: (logger, configService) => async () => {
        try {
          configService.get('dryRun');
          console.log('starting cli...');
        } catch (e) {
          logger.error(e);
          process.exit(1);
        }
      },
      inject: [LOGGER, CONFIG_SERVICE] as const,
    }),
  ],
});

// 1 define packages for the bump
// 2 calculate dependencies between them
// 3 calculate the next version for each packages based on NEXT_VER provider
// 4
