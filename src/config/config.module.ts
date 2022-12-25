import { createModule, injectable } from '@fridgefm/inverter';
import { z } from 'zod';
import {
  CONFIG_SERVICE,
  ENV_USED,
  ENV_VALIDATE,
  type PossibleValues,
  type EnvStorage,
  type ValidationMap,
} from './config.tokens';

export const ConfigModule = createModule({
  name: 'ConfigModule',
  providers: [
    injectable({
      scope: 'scoped',
      provide: CONFIG_SERVICE,
      useFactory: async (envs, validators) => {
        const envStorage = new Map() as EnvStorage;
        envs.forEach((a) => {
          Object.entries(a).forEach(([key, value]) => {
            envStorage.set(key, value);
          });
        });

        const mergedSchema = validators.reduce((acc, createSchema) => {
          const schema = createSchema(z);
          Object.keys(schema).forEach((key) => {
            if (acc[key]) {
              throw new Error(`Duplicate validation for field: ${key}`);
            }
          });
          return { ...acc, ...schema };
        }, {} as ValidationMap);

        await Promise.all(
          Object.entries(mergedSchema).map((valid) => {
            const [envName, envValidation] = valid;
            const envValue = envStorage.get(envName);

            return envValidation
              .parseAsync(envValue)
              .then((a) => {
                envStorage.set(envName, a);
                return a;
              })
              .catch((e) => {
                if (e.issues?.[0]) {
                  throw new Error(
                    `Validation failed for env "${envName}", reason: "${e.issues[0].message}"`,
                  );
                }
                throw e;
              });
          }),
        );

        return {
          get: <A>(key: string) =>
            envStorage.get(key) as A extends PossibleValues ? A : unknown | undefined,
          getOrThrow: <A>(key: string) => {
            const hasValue = envStorage.get(key);
            if (typeof hasValue === 'undefined') {
              throw new Error(`Config env not set: "${key}"`);
            }
            return hasValue as A extends PossibleValues ? A : unknown;
          },
          getAll: () => [...envStorage.entries()].reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
        };
      },
      inject: [ENV_USED, ENV_VALIDATE] as const,
    }),
  ],
  exports: { CONFIG_SERVICE, ENV_VALIDATE, ENV_USED },
});
