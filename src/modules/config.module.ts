import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import { LOGGER, RENDER_SERVICE } from './render.module';

type Config = {
  localPackagesDir: string;
  dryRun: boolean;
  buildDir: string;
  npmRegistryUrl: string;
  npmAuthToken: string;
};

type Variable<T extends keyof Config> = {
  value: Config[T];
  private?: boolean;
  validation?: (value: Config[T]) => string[];
};

type Mapper = {
  [P in keyof Config]: Required<Variable<P>>;
};

type ConfigService = {
  get: <S extends keyof Mapper>(s: S) => Mapper[S];
};

const maskString = (s: string) => {
  const len = s.length;
  const letted = Math.floor(len / 3);
  const fixed = letted > 8 ? 8 : letted;
  const arr = (l: number) => new Array(l).fill('*').join('');

  return `${arr(len - fixed)}${fixed >= 1 ? s.slice(-fixed) : arr(fixed)}`;
};

export const CONFIG_SERVICE = createToken<ConfigService>('config:service');
export const CONFIG_MAPPER = createToken<Mapper>('config:mapper');
export const CONFIG_EXTERNAL = createToken<Partial<Config>>('config:external');

const createVar = <V extends keyof Config>(args: Variable<V>) =>
  ({
    value: args.value,
    private: args.private || false,
    validation: args.validation || (() => [] as string[]),
  } as const);

export const ConfigModule = declareModule({
  name: 'ConfigModule',
  providers: [
    injectable({
      provide: CONFIG_SERVICE,
      useFactory: (logger, renderService, configMapper) => {
        const allErrors = Object.entries(configMapper).reduce((acc, cur) => {
          const [configKey, { validation, value }] = cur;
          // @ts-ignore
          validation(value).forEach((error) => {
            acc.push({ configKey, error });
          });
          return acc;
        }, [] as { configKey: string; error: string }[]);

        if (!!allErrors.length) {
          logger.error(allErrors);
          throw new Error('ConfigService initialization failed, see logging above');
        } else {
          const mapped = Object.entries(configMapper).reduce((acc, cur) => {
            const [key, variable] = cur;
            return {
              ...acc,
              [key]: variable.private
                ? maskString(variable.value.toString())
                : variable.value.toString(),
            };
          }, {} as Record<string, string>);
          renderService.table(mapped);
        }

        return {
          get: <S extends keyof Mapper>(key: S): Mapper[S] => {
            const variable = configMapper[key];
            if (variable.private) {
              throw new Error('Trying to get private variable');
            }
            return variable;
          },
        };
      },
      inject: [LOGGER, RENDER_SERVICE, CONFIG_MAPPER] as const,
    }),
    injectable({
      provide: CONFIG_MAPPER,
      useFactory: (configExternal) => ({
        npmAuthToken: createVar({
          value: process.env.NPM_AUTH_TOKEN || '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', // @TODO rename fake
          validation: (s) => (!s ? ['Env variable "NPM_AUTH_TOKEN" should be passed'] : []),
          private: true,
        }),
        npmRegistryUrl: createVar({
          value: configExternal.npmRegistryUrl || 'https://registry.npmjs.org/',
        }),
        localPackagesDir: createVar({
          value: configExternal.localPackagesDir || process.cwd(),
        }),
        dryRun: createVar({
          value: true,
        }),
        buildDir: createVar({
          value: configExternal.buildDir || '',
          validation: (s) => (!s ? ['Missing property "buildDir" on config file'] : []),
        }),
      }),
      inject: [CONFIG_EXTERNAL] as const,
    }),
    injectable({
      provide: CONFIG_EXTERNAL,
      useValue: {
        buildDir: './dist/', // @TODO this one changes
      },
    }),
  ],
});
