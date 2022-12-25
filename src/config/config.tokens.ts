import { createToken, modifyToken } from '@fridgefm/inverter';
import type { ZodSchema, z } from 'zod';

export type PossibleValues = string | boolean | number;
export type EnvStorage = Map<string, PossibleValues>;
export type ValidationMap = Record<string, ZodSchema>;

export const CONFIG_SERVICE = createToken<{
  get: <A>(key: string) => A extends PossibleValues ? A : unknown | undefined;
  getOrThrow: <A>(key: string) => A extends PossibleValues ? A : unknown;
  getAll: () => Record<string, PossibleValues>;
}>('config:service');
export const ENV_USED = modifyToken.multi(
  createToken<Record<string, PossibleValues>>('config:env_used'),
);
export const ENV_VALIDATE = modifyToken.multi(
  createToken<(zod: typeof z) => Record<string, ZodSchema>>('config:env:validate'),
);
