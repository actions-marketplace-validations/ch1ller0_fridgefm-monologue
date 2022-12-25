import { createToken, modifyToken, TokenProvide } from '@fridgefm/inverter';
import type { Injectable } from '@fridgefm/inverter/lib/base/injectable.types';
import type { Command } from 'commander';
import type { ENV_USED } from '../config/config.tokens';

export type Register = (
  command: Injectable.Instance,
  options: TokenProvide<typeof ENV_USED>,
) => void;

export const CLI_COMMAND = modifyToken.multi(
  createToken<(a: { program: Command; register: Register }) => void>('cli:command'),
);
export const CLI_ROOT = createToken<Promise<unknown>>('cli:root');
export const CLI_RUN = createToken<() => Promise<void>>('cli:run');
