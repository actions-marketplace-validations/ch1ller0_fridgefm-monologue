import { createToken, declareModule, injectable } from '@fridgefm/inverter';
import { LOGGER, RENDER_SERVICE } from '../render.module';
import { maskString } from './utils';

type PossibleValues = string | boolean;

type Config = {
  localPackagesDir: string;
  dryRun: boolean;
  npmRegistryUrl: string;
  npmAuthToken: string;
};

type Variable<V extends PossibleValues> = {
  value: V;
  private?: boolean;
  validation?: (value: V) => string[];
};

type Mapper = {
  readonly [P in keyof Config]: Required<Variable<Config[P]>>;
};

export const CONFIG_SERVICE = createToken<{
  get: <S extends keyof Mapper>(s: S) => Mapper[S]['value'];
}>('config:service');
export const CONFIG_MAPPER = createToken<Mapper>('config:mapper');
export const CONFIG_EXTERNAL = createToken<Partial<Config>>('config:external');

const createVar = <V extends PossibleValues>(args: Variable<V>) =>
  ({
    value: args.value,
    private: args.private || false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validation: args.validation || ((_: V) => [] as string[]),
  } as Required<Variable<V>>);

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
          get: <S extends keyof Mapper>(key: S) => {
            const variable = configMapper[key];
            if (variable.private) {
              throw new Error('Trying to get private variable');
            }
            return variable.value;
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
          value: configExternal.localPackagesDir ?? './*',
        }),
        dryRun: createVar({ value: configExternal.dryRun ?? true }),
      }),
      inject: [CONFIG_EXTERNAL] as const,
    }),
    injectable({
      provide: CONFIG_EXTERNAL,
      useValue: {},
    }),
  ],
});
