import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createToken, declareModule, injectable, modifyToken } from '@fridgefm/inverter';
import merge from '@tinkoff/utils/object/merge';
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
export const CONFIG_EXTERNAL = modifyToken.multi(createToken<Partial<Config>>('config:external'));

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
      useFactory: (externalConfigs) => {
        const { npmRegistryUrl, localPackagesDir, dryRun, npmAuthToken } = merge(
          ...externalConfigs,
        );

        return {
          npmAuthToken: createVar({
            value: npmAuthToken || '',
            validation: (s) => (!s ? ['Config for "npmAuthToken" should be set'] : []),
            private: true,
          }),
          npmRegistryUrl: createVar({
            value: npmRegistryUrl ?? 'https://registry.npmjs.org/',
          }),
          localPackagesDir: createVar({
            value: localPackagesDir ?? './*',
          }),
          dryRun: createVar({ value: dryRun ?? true }),
        };
      },
      inject: [CONFIG_EXTERNAL] as const,
    }),
    injectable({
      provide: CONFIG_EXTERNAL,
      useFactory: () => {
        const shared = { npmAuthToken: process.env.NAPM_AUTH_TOKEN };
        try {
          const fileContents = readFileSync(resolve(process.cwd(), '.autopub.json'), {
            encoding: 'utf-8',
          });
          return { ...shared, ...JSON.parse(fileContents) };
        } catch (e) {
          // @ts-ignore
          if (e.code === 'ENOENT') return shared;
          throw e;
        }
      },
    }),
  ],
  extend: {
    forRoot: (config: Partial<Config>) => [
      injectable({
        provide: CONFIG_EXTERNAL,
        useValue: config,
      }),
    ],
  },
});
